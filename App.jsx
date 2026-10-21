import { useState } from "react";
import {
  Activity, ArrowUpRight, BookOpenCheck, CheckCircle2, CircleHelp,
  Clock3, FileSearch, FlaskConical, Gauge, History, Info, LoaderCircle,
  Search, ShieldCheck, Sparkles, TriangleAlert, XCircle
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/analyze";

const demoText = "The human heart has four chambers. Water boils at 100 degrees Celsius at standard atmospheric pressure. The Great Wall of China is visible from the Moon with the naked eye.";

function StatusIcon({ status }) {
  if (status === "Evidence found") return <CheckCircle2 size={17} />;
  if (status === "Needs review") return <TriangleAlert size={17} />;
  return <CircleHelp size={17} />;
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expanded, setExpanded] = useState(0);

  async function analyze() {
    if (input.trim().length < 20) {
      setError("Please paste an answer with at least 20 characters.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
      setResult(data);
      setExpanded(0);
      setActiveTab("all");
    } catch (e) {
      setError(e.message || "Could not connect to backend. Make sure the backend terminal is running.");
    } finally {
      setLoading(false);
    }
  }

  const filteredClaims = (result?.claims || []).filter((claim) => {
    if (activeTab === "all") return true;
    if (activeTab === "evidence") return claim.status === "Evidence found";
    if (activeTab === "review") return claim.status === "Needs review";
    return claim.status === "Unverified";
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={23} /></div>
          <div><strong>Verity<span>AI</span></strong><small>TRUTH, WITH EVIDENCE</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="side-link active"><FileSearch size={18} /> Hallucination check</button>
        <button className="side-link" onClick={() => { setResult(null); setInput(""); setError(""); }}><History size={18} /> New analysis</button>
        <div className="sidebar-bottom">
          <div className="mini-shield"><FlaskConical size={18} /></div>
          <strong>Research preview</strong>
          <p>An educational prototype for exploring AI answer reliability.</p>
          <div className="status-line"><span className="online-dot" /> Evidence search enabled</div>
        </div>
        <div className="sidebar-foot">COLLEGE PROJECT · v1.0</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <b>Hallucination check</b></div>
          <div className="top-pill"><span className="online-dot" /> Prototype active</div>
        </header>

        <div className="page-content">
          <section className="hero">
            <div className="eyebrow"><Sparkles size={14} /> AI RELIABILITY LAB</div>
            <h1>Don't just trust the answer.<br /><span>Verify the evidence.</span></h1>
            <p className="hero-copy">Inspect AI-generated statements, discover related sources, and identify claims that need a closer look.</p>
            <div className="hero-tags"><span><ShieldCheck size={14} /> Claim-level review</span><span><BookOpenCheck size={14} /> Source discovery</span><span><Activity size={14} /> Transparent scoring</span></div>
          </section>

          <section className="input-card">
            <div className="section-heading">
              <div className="heading-icon"><FileSearch size={19} /></div>
              <div><h2>Analyze an AI response</h2><p>Paste text below to begin your evidence check.</p></div>
              <span className="step-tag">STEP 01</span>
            </div>
            <label className="input-label" htmlFor="answer">AI-GENERATED TEXT</label>
            <textarea id="answer" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste an answer from ChatGPT or another AI tool here..." maxLength={12000} />
            <div className="input-footer"><span>{input.length.toLocaleString()} / 12,000 characters</span><button className="sample-button" onClick={() => { setInput(demoText); setError(""); }}><Sparkles size={14} /> Try sample text</button></div>
            {error && <div className="error-box"><TriangleAlert size={17} /> {error}</div>}
            <div className="analyze-row"><div className="privacy-note"><Info size={15} /> Text is sent to your local backend for analysis.</div><button className="analyze-button" onClick={analyze} disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Checking sources...</> : <><Search size={17} /> Analyze response <ArrowUpRight size={16} /></>}</button></div>
          </section>

          {loading && <div className="loading-card"><div className="loading-orb"><LoaderCircle className="spin" size={25} /></div><h3>Looking for evidence</h3><p>Breaking text into claims and searching related source material. This can take a few seconds.</p></div>}

          {result && !loading && <>
            <section className="results-head"><div><div className="eyebrow result-eyebrow"><Activity size={14} /> ANALYSIS COMPLETE</div><h2>Verification overview</h2><p>Review each claim and inspect its source before drawing conclusions.</p></div><div className="completed-badge"><CheckCircle2 size={15} /> Analysis ready</div></section>
            <section className="metrics-grid">
              <div className="metric-card score-card"><div className="metric-top"><span>Evidence-match index</span><Gauge size={18} /></div><div className="score-row"><strong>{result.overall_score}<small>/100</small></strong><div className="score-ring" style={{ "--score": `${result.overall_score}%` }}><span>{result.overall_score}</span></div></div><div className="metric-foot">Heuristic score · not probability of truth</div></div>
              <div className="metric-card"><div className="metric-top"><span>Evidence found</span><CheckCircle2 size={18} /></div><strong className="metric-number green">{result.summary.evidence_found}</strong><div className="metric-foot">Claims with stronger text matches</div></div>
              <div className="metric-card"><div className="metric-top"><span>Needs review</span><TriangleAlert size={18} /></div><strong className="metric-number amber">{result.summary.needs_review}</strong><div className="metric-foot">Related material; weak match</div></div>
              <div className="metric-card"><div className="metric-top"><span>Unverified</span><CircleHelp size={18} /></div><strong className="metric-number slate">{result.summary.unverified}</strong><div className="metric-foot">No usable evidence returned</div></div>
            </section>

            <section className="claims-card">
              <div className="claims-title"><div><h2>Claim-by-claim results</h2><p>{result.summary.total} statements extracted from your text</p></div><span className="step-tag">STEP 02</span></div>
              <div className="filter-tabs">
                {[["all", "All claims"], ["evidence", "Evidence found"], ["review", "Needs review"], ["unverified", "Unverified"]].map(([key, label]) => <button key={key} className={activeTab === key ? "filter-tab selected" : "filter-tab"} onClick={() => setActiveTab(key)}>{label}<span>{key === "all" ? result.summary.total : key === "evidence" ? result.summary.evidence_found : key === "review" ? result.summary.needs_review : result.summary.unverified}</span></button>)}
              </div>
              <div className="claim-list">
                {filteredClaims.map((claim) => {
                  const originalIndex = result.claims.indexOf(claim);
                  const isOpen = expanded === originalIndex;
                  const statusClass = claim.status === "Evidence found" ? "found" : claim.status === "Needs review" ? "review" : "unverified";
                  return <article className={`claim-item ${isOpen ? "opened" : ""}`} key={originalIndex}>
                    <button className="claim-toggle" onClick={() => setExpanded(isOpen ? -1 : originalIndex)}>
                      <div className={`claim-status-icon ${statusClass}`}><StatusIcon status={claim.status} /></div>
                      <div className="claim-main"><div className="claim-meta"><span>CLAIM {String(originalIndex + 1).padStart(2, "0")}</span><span className={`status-label ${statusClass}`}>{claim.status}</span></div><p>{claim.claim}</p></div>
                      <div className="claim-confidence"><strong>{claim.confidence}%</strong><small>match index</small></div>
                      <span className={`chevron ${isOpen ? "up" : ""}`}>⌄</span>
                    </button>
                    {isOpen && <div className="claim-detail"><div className="detail-note"><Info size={16} /><p>{claim.explanation}</p></div><div className="evidence-heading"><BookOpenCheck size={16} /><strong>Related evidence</strong><span>{claim.evidence.length} sources</span></div>
                      {claim.evidence.length ? <div className="evidence-list">{claim.evidence.map((item, idx) => <div className="evidence-item" key={item.url}><div className="source-number">{idx + 1}</div><div className="source-content"><a href={item.url} target="_blank" rel="noreferrer">{item.title} <ArrowUpRight size={13} /></a><p>{item.snippet.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</p><div className="source-bottom"><span>Text overlap: {item.match_score}%</span><a href={item.url} target="_blank" rel="noreferrer">Open source</a></div></div></div>)}</div> : <div className="no-evidence"><CircleHelp size={18} /><div><strong>No source results returned</strong><p>Try a more specific claim or verify it using another trusted source.</p></div></div>}
                    </div>}
                  </article>;
                })}
                {!filteredClaims.length && <div className="empty-filter">No claims match this filter.</div>}
              </div>
            </section>
            <div className="disclaimer"><TriangleAlert size={18} /><div><strong>Important limitation</strong><p>{result.disclaimer}</p></div></div>
          </>}

          {!result && !loading && <section className="how-section"><div className="how-title"><div><span className="eyebrow">THE WORKFLOW</span><h2>Evidence first. Conclusions second.</h2></div><span className="step-tag">3 STEPS</span></div><div className="how-grid"><div className="how-card"><div className="how-icon blue"><FileSearch size={20} /></div><span>01</span><h3>Extract claims</h3><p>Split a long AI response into smaller statements that can be reviewed separately.</p></div><div className="how-card"><div className="how-icon green"><BookOpenCheck size={20} /></div><span>02</span><h3>Find related sources</h3><p>Search public reference material and show links that a person can inspect.</p></div><div className="how-card"><div className="how-icon peach"><Gauge size={20} /></div><span>03</span><h3>Review the evidence</h3><p>Use cautious labels and transparent text matching to decide what needs further checking.</p></div></div></section>}

          <footer className="footer"><span>VERITY AI <i>·</i> COLLEGE PROJECT</span><span><ShieldCheck size={14} /> Built for careful verification, not blind trust.</span></footer>
        </div>
      </main>
    </div>
  );
}
