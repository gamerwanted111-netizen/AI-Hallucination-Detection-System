# AI Hallucination Detection System

A beginner-friendly college project with a React + Vite frontend and a FastAPI backend.

## What it does
- Accepts an AI-generated answer.
- Splits it into individual claims.
- Searches Wikipedia's public API for related evidence.
- Shows source links, evidence snippets, a transparent evidence-match score, and a cautious status.
- Treats missing/weak evidence as **Unverified** rather than pretending the claim is false.

> Important: this is an educational prototype, not a definitive truth detector. Wikipedia coverage is limited, and text similarity is not proof of truth. A real research-grade system needs broader sources, better claim extraction, and human-reviewed evaluation.

## Requirements
- Node.js (LTS recommended)
- Python 3.10+

## Run the backend
Open a terminal in this folder:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

If PowerShell blocks activation, use Command Prompt:
```bat
.venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. API docs: `http://127.0.0.1:8000/docs`.

## Run the frontend
Open a **second terminal** in the project folder:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Project structure
```text
AI_Hallucination_Detection_System/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── App.css
```

## Troubleshooting
- If `python` is not recognized, install Python and enable "Add Python to PATH".
- If `npm` is not recognized, install Node.js and reopen VS Code.
- Keep the backend terminal running while using the website.
- The backend needs internet access to query Wikipedia.
- If the request fails, check that the backend is running at port 8000.
