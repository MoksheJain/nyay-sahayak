# process_contract_pdf.py
import os
import json
import re
from typing import Dict, Any, List, Optional
from pdf_utils import save_contract_as_pdf
from legal_utils import read_contract_pdf, llm, split_paragraphs
from rag_utils import query_pdf_faiss  # your existing RAG loader

# -----------------------------
# Helpers
# -----------------------------
def _norm_text(s: Optional[str]) -> str:
    if not s:
        return ""
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[\"'`‘’“”]", '"', s)
    return s

def _unique_preserve_order(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for it in items:
        key = _norm_text(it)[:1200]
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out

# -----------------------------
# Prompt Template (ESCAPED braces)
# -----------------------------
EXPLOIT_CHECK_PROMPT = """You are a senior legal analyst AI. You will be given multiple contract clauses, each labelled with an index.

INSTRUCTIONS (READ CAREFULLY):
- For each clause, produce a JSON object with keys:
  "index": <integer index corresponding to clause>,
  "clause": "<original clause text>",
  "exploit_level": one of "Exploitable", "Negotiable", "Standard", or "Unknown",
  "explanation": "<detailed explanation; 2-5 sentences>",
  "lawyer_questions": [ "<question1>", "<question2>", ... ] (2-3 questions recommended)
- Preserve the index value exactly as given.
- Return exactly one JSON array (top-level) containing objects only. Do NOT include surrounding text or markdown formatting.
- Example output format:
[
  {{
    "index": 1,
    "clause": "Clause text here",
    "exploit_level": "Negotiable",
    "explanation": "Detailed explanation...",
    "lawyer_questions": ["Q1", "Q2"]
  }},
  ...
]

Clauses (index: clause):
{clauses}
"""

# -----------------------------
# Main processing
# -----------------------------
def process_contract(
    file_path: str,
    use_rag: bool = True,
    top_k: int = 5,
    max_clauses_in_prompt: int = 20
) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    contract_text = read_contract_pdf(file_path)
    paragraphs = split_paragraphs(contract_text)
    if not paragraphs:
        return {"error": "No readable text found in PDF."}

    clauses_in_order: List[str] = []
    for para in paragraphs:
        if not para.strip():
            continue
        if use_rag:
            try:
                rag_result = query_pdf_faiss(file_path, para, top_k=top_k)
                top_chunks = [r["chunk"] for r in rag_result.get("results", [])]
                clauses_in_order.append(para)
                if top_chunks:
                    clauses_in_order.append(top_chunks[0])
            except Exception as e:
                print(f"⚠️ RAG error for a paragraph: {e}")
                clauses_in_order.append(para)
        else:
            clauses_in_order.append(para)

    clauses_in_order = _unique_preserve_order(clauses_in_order)
    if len(clauses_in_order) > max_clauses_in_prompt:
        clauses_in_order = clauses_in_order[:max_clauses_in_prompt]

    numbered_lines = []
    for i, c in enumerate(clauses_in_order, start=1):
        one_line = c.replace("\n", " ").strip()
        numbered_lines.append(f"{i}: {one_line}")
    numbered_block = "\n".join(numbered_lines)

    # ✅ ESCAPED format call
    prompt = EXPLOIT_CHECK_PROMPT.format(clauses=numbered_block)

    print(f"\n🧠 Sending prompt with {len(clauses_in_order)} clauses...")
    response = llm.invoke(prompt)
    raw_output = getattr(response, "content", str(response))

    print("\n🧩 Raw LLM output preview (first 1000 chars):\n", raw_output[:1000])

    # Parse JSON
    exploit_analysis = None
    try:
        exploit_analysis = json.loads(raw_output)
    except Exception:
        try:
            first, last = raw_output.find("["), raw_output.rfind("]")
            if first != -1 and last != -1:
                exploit_analysis = json.loads(raw_output[first:last + 1])
        except Exception as e:
            print("⚠️ JSON parse failed:", e)
            exploit_analysis = None

    if not exploit_analysis:
        exploit_analysis = []
        for idx, clause in enumerate(clauses_in_order, start=1):
            exploit_analysis.append({
                "index": idx,
                "clause": clause,
                "exploit_level": "Unknown",
                "explanation": "No valid JSON returned.",
                "lawyer_questions": []
            })

    # Order by index
    index_map = {}
    for item in exploit_analysis:
        try:
            idx = int(item.get("index", -1))
            index_map[idx] = item
        except Exception:
            pass

    ordered_results = []
    for i in range(1, len(clauses_in_order) + 1):
        if i in index_map:
            ordered_results.append(index_map[i])
        else:
            ordered_results.append({
                "index": i,
                "clause": clauses_in_order[i - 1],
                "exploit_level": "Unknown",
                "explanation": "No analysis returned for this clause.",
                "lawyer_questions": []
            })

    return {
        "file": file_path,
        "total_clauses_sent": len(clauses_in_order),
        "returned": len(ordered_results),
        "exploit_analysis": ordered_results
    }