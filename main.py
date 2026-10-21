
from typing import List
import html
import re

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="AI Hallucination Detection API",
    description="Educational prototype for claim-level evidence discovery.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": (
        "CollegeHallucinationDetector/1.1 "
        "(educational student project)"
    )
}

STOP_WORDS = {
    "the", "and", "for", "that", "this", "with", "from",
    "are", "was", "were", "has", "have", "had", "its",
    "into", "their", "they", "them", "then", "than",
    "will", "would", "could", "should", "about", "which",
    "when", "where", "what", "who", "why", "how", "not",
    "but", "can", "may", "might", "also", "such", "been",
    "being", "the", "a", "an", "of", "to", "in", "on",
    "at", "by", "as", "is", "it", "or", "be", "we",
    "you", "he", "she", "his", "her", "our", "your",
    "more", "most", "very", "all", "each", "than",
    "over", "under", "after", "before", "between",
    "around", "during", "through", "there", "here",
    "one", "two", "first", "second", "third",
    "clearly", "known", "called", "used"
}


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=20, max_length=12000)


class Evidence(BaseModel):
    title: str
    url: str
    snippet: str
    match_score: int


class ClaimResult(BaseModel):
    claim: str
    status: str
    confidence: int
    explanation: str
    evidence: List[Evidence]


class AnalyzeResponse(BaseModel):
    overall_score: int
    summary: dict
    claims: List[ClaimResult]
    disclaimer: str


def split_claims(text: str) -> List[str]:
    """Split text into sentence-like claims for this prototype."""
    cleaned = re.sub(r"\s+", " ", text).strip()

    parts = re.split(
        r'(?<=[.!?])\s+(?=[A-Z0-9"\'])',
        cleaned,
    )

    claims = []
    for part in parts:
        part = part.strip(" \t\n-•")
        if len(part) >= 18:
            claims.append(part)

    return claims[:12]


def keywords(text: str) -> set:
    words = re.findall(r"[a-zA-Z0-9]{2,}", text.lower())
    return {
        word for word in words
        if word not in STOP_WORDS and not word.isdigit()
    }


def clean_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def search_wikipedia(claim: str) -> List[dict]:
    """Find candidate Wikipedia pages and retrieve readable extracts."""
    try:
        response = requests.get(
            WIKI_API,
            params={
                "action": "query",
                "list": "search",
                "srsearch": claim,
                "srlimit": 5,
                "srprop": "snippet",
                "format": "json",
                "utf8": 1,
            },
            headers=HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        search_results = (
            response.json().get("query", {}).get("search", [])
        )

        if not search_results:
            return []

        page_ids = [
            str(item["pageid"])
            for item in search_results
            if "pageid" in item
        ]

        extracts = {}
        if page_ids:
            extract_response = requests.get(
                WIKI_API,
                params={
                    "action": "query",
                    "pageids": "|".join(page_ids),
                    "prop": "extracts",
                    "explaintext": 1,
                    "exchars": 900,
                    "format": "json",
                    "utf8": 1,
                },
                headers=HEADERS,
                timeout=10,
            )
            extract_response.raise_for_status()

            pages = (
                extract_response.json()
                .get("query", {})
                .get("pages", {})
            )

            for page in pages.values():
                extracts[str(page.get("pageid", ""))] = (
                    page.get("extract", "")
                )

        for item in search_results:
            page_id = str(item.get("pageid", ""))
            item["readable_extract"] = extracts.get(page_id, "")

        return search_results

    except (requests.RequestException, ValueError):
        return []


def calculate_relevance(claim: str, title: str, snippet: str) -> int:
    """
    Estimate text relevance only.
    This score does not measure truth or contradiction.
    """
    claim_words = keywords(claim)
    if not claim_words:
        return 0

    title_words = keywords(title)
    snippet_words = keywords(snippet)

    all_source_words = title_words | snippet_words
    claim_coverage = len(claim_words & all_source_words) / len(claim_words)

    title_coverage = (
        len(claim_words & title_words) / len(claim_words)
    )

    normalized_claim = " ".join(claim.lower().split())
    normalized_source = " ".join(
        (title + " " + snippet).lower().split()
    )

    phrase_bonus = (
        10 if normalized_claim.rstrip(".!?") in normalized_source else 0
    )

    score = (
        70 * claim_coverage
        + 20 * title_coverage
        + phrase_bonus
    )

    return max(0, min(100, round(score)))


def find_evidence(claim: str) -> List[Evidence]:
    results = search_wikipedia(claim)
    evidence = []

    for item in results:
        title = item.get("title", "").strip()
        search_snippet = clean_html(item.get("snippet", ""))
        extract = clean_html(item.get("readable_extract", ""))

        # Prefer page content over a short search-result snippet.
        snippet = extract or search_snippet
        if not title or not snippet:
            continue

        score = calculate_relevance(claim, title, snippet)

        page_title = requests.utils.quote(
            title.replace(" ", "_"),
            safe="()_,-",
        )

        evidence.append(
            Evidence(
                title=title,
                url=f"https://en.wikipedia.org/wiki/{page_title}",
                snippet=snippet[:900],
                match_score=score,
            )
        )

    evidence.sort(
        key=lambda item: item.match_score,
        reverse=True,
    )

    # Return the most relevant results, not every search result.
    return evidence[:3]


@app.get("/")
def root():
    return {
        "message": "AI Hallucination Detection API is running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    claims = split_claims(payload.text)

    if not claims:
        raise HTTPException(
            status_code=422,
            detail="Please enter at least one complete factual sentence.",
        )

    results: List[ClaimResult] = []

    for claim in claims:
        evidence = find_evidence(claim)
        best_score = evidence[0].match_score if evidence else 0

        if evidence and best_score >= 40:
            status = "Evidence found"
            confidence = best_score
            explanation = (
                "A relatively relevant source was found. This score "
                "measures text relevance only. Read the source and check "
                "whether it actually supports or contradicts the claim."
            )

        elif evidence:
            status = "Needs review"
            confidence = best_score
            explanation = (
                "Some related material was found, but its relevance "
                "may be limited. The available search results do not "
                "establish whether the claim is true or false."
            )

        else:
            status = "Unverified"
            confidence = 0
            explanation = (
                "No usable Wikipedia search results were returned. "
                "This does not mean the claim is false. Check another "
                "reliable source or try a more specific claim."
            )

        results.append(
            ClaimResult(
                claim=claim,
                status=status,
                confidence=confidence,
                explanation=explanation,
                evidence=evidence,
            )
        )

    counts = {
        "evidence_found": sum(
            item.status == "Evidence found" for item in results
        ),
        "needs_review": sum(
            item.status == "Needs review" for item in results
        ),
        "unverified": sum(
            item.status == "Unverified" for item in results
        ),
        "total": len(results),
    }

    overall = round(
        sum(item.confidence for item in results) / len(results)
    )

    return AnalyzeResponse(
        overall_score=overall,
        summary=counts,
        claims=results,
        disclaimer=(
            "Educational prototype only. The score estimates text "
            "relevance between a claim and retrieved Wikipedia content; "
            "it is not the probability that a claim is true. Search "
            "results may be incomplete or misleading. The system does "
            "not reliably determine truth or contradiction. Inspect "
            "sources and use additional trusted references."
        ),
    )
