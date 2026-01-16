# legal_utils.py
import os
import pickle
import re
import uuid
from typing import List, Dict
from collections import Counter
import pdfplumber
import faiss
import numpy as np
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

from rag_engine import ChatGroq

# -----------------------
# LLM setup
# -----------------------
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.2,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

def generate_contract(contract_type: str, parties: dict, terms: dict, llm_instance: ChatGroq):
    """
    Generate a legal contract based on input info.
    Args:
        contract_type: "Consulting Agreement", "NDA", etc.
        parties: {"party_a": "Company", "party_b": "Consultant"}
        terms: dict of clauses, e.g. {"payment": "500 USD per hour", "duration": "1 year"}
        llm_instance: your ChatGroq LLM instance
    Returns:
        Generated contract text (string)
    """
    prompt = f"""
You are a legal assistant. Draft a {contract_type} between {parties['party_a']} and {parties['party_b']}.
Include the following terms in clear legal language:
{terms}

Provide a full contract in paragraphs.
"""
    response = llm_instance.invoke(prompt)
    return response.content if hasattr(response, "content") else str(response)

# -----------------------
# FAISS + standard clause DB setup
# -----------------------
BASE_PATH = "database/standard_clauses_db"
FAISS_INDEX_PATH = os.path.join(BASE_PATH, "index.faiss")
METADATA_PATH = os.path.join(BASE_PATH, "index.pkl")

if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(METADATA_PATH):
    raise FileNotFoundError(f"FAISS index or metadata not found in {BASE_PATH}")

faiss_index = faiss.read_index(FAISS_INDEX_PATH)
with open(METADATA_PATH, "rb") as f:
    metadata_clauses = pickle.load(f)

# -----------------------
# Embedding model
# -----------------------
embedding_model = SentenceTransformer("all-mpnet-base-v2")
SIMILARITY_THRESHOLD = 0.65  # below this -> Non-standard

# -----------------------
# PDF utilities
# -----------------------
def read_contract_pdf(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    text_pages = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_pages.append(text)
    return "\n".join(text_pages)

def split_paragraphs(text: str) -> List[str]:
    """
    Split PDF text into paragraphs.
    - Keep headings like '18. DISPUTES' together with their body.
    - Merge lines intelligently if they are part of the same paragraph.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    paragraphs = []
    buffer = ""

    for line in lines:
        # Detect clause headings like "18. DISPUTES"
        if re.match(r"^\d+\.\s+[A-Z ]+$", line):
            if buffer:
                paragraphs.append(buffer.strip())
                buffer = ""
            buffer = line  # start new paragraph with heading
        else:
            buffer += (" " + line) if buffer else line

        # end of paragraph heuristics
        if line.endswith(".") or line.endswith(";") or line.endswith(":"):
            paragraphs.append(buffer.strip())
            buffer = ""

    if buffer:
        paragraphs.append(buffer.strip())

    return paragraphs
# -----------------------
# Highlight non-standard paragraphs
# -----------------------
def highlight_non_standard_paragraphs(text: str, top_k: int = 5) -> List[Dict]:
    paragraphs = split_paragraphs(text)
    results = []

    for para in paragraphs:
        para_emb = embedding_model.encode([para], convert_to_numpy=True, normalize_embeddings=True)
        D, I = faiss_index.search(para_emb, top_k)

        top_results, similarities, categories = [], [], []
        for score, idx in zip(D[0], I[0]):
            meta = metadata_clauses[idx]
            top_results.append(meta)
            similarities.append(float(score))
            categories.append(meta.get("category", "Unknown"))

        max_sim = max(similarities) if similarities else 0.0
        classification = "Non-standard" if max_sim < SIMILARITY_THRESHOLD else "Standard"
        top_category = Counter(categories).most_common(1)[0][0] if categories else "Unknown"

        results.append({
            "paragraph": para,
            "classification": classification,
            "confidence": round(max_sim, 3),
            "top_clauses_count": len(top_results),
            "top_category": top_category
        })

    return results

# -----------------------
# Summarize contract sections via LLM
# -----------------------
def summarize_contract_sections(text: str) -> Dict:
    paragraphs = split_paragraphs(text)
    full_text = "\n".join(paragraphs)
    prompt = f"Summarize the following legal text concisely:\n\n{full_text}\n\nSummary:"
    response = llm.invoke(prompt)
    summary_text = response.content if hasattr(response, "content") else str(response)
    return {"summary": summary_text.strip()}

# -----------------------
# Cluster clauses
# -----------------------
def cluster_clauses(n_clusters: int = 5) -> Dict[int, List[str]]:
    texts = [m["text"] for m in metadata_clauses]
    if not texts:
        return {}
    embeddings = embedding_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    from sklearn.cluster import KMeans
    kmeans = KMeans(n_clusters=min(n_clusters, len(texts)), random_state=42)
    labels = kmeans.fit_predict(embeddings)
    clusters = {i: [] for i in range(max(labels)+1)}
    for text, label in zip(texts, labels):
        clusters[label].append(text)
    return clusters

# -----------------------
# Semantic search over standard clauses
# -----------------------
def search_contract(query: str, top_k: int = 5) -> Dict:
    query_emb = embedding_model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = faiss_index.search(query_emb, top_k)
    results = []
    for score, idx in zip(D[0], I[0]):
        meta = metadata_clauses[idx]
        results.append({
            "paragraph": meta["text"],
            "metadata": meta,
            "similarity": float(score)
        })
    return {"query": query, "results": results}

# -----------------------
# Analyze full contract PDF
# -----------------------
def analyze_contract_pdf_file(file_path: str) -> Dict:
    text = read_contract_pdf(file_path)
    highlights = highlight_non_standard_paragraphs(text)
    summary = summarize_contract_sections(text)
    clusters = cluster_clauses(5)
    return {
        "summary": summary,
        "highlighted_paragraphs": highlights,
        "clusters": {k: v[:3] for k, v in clusters.items()}
    }

# -----------------------
# Query PDF with FAISS + optional LLM answer
# -----------------------
def query_pdf_with_faiss(file_path: str, query: str, top_k: int = 5, llm=None) -> Dict:
    """
    Query a PDF file using FAISS + optional LLM for answer generation.
    Returns top paragraphs and a confident answer.
    """
    # --- Extract paragraphs from PDF ---
    reader = PdfReader(file_path)
    paragraphs = [
        line.strip()
        for page in reader.pages
        for line in (page.extract_text() or "").split("\n")
        if len(line.strip()) > 20
    ]
    if not paragraphs:
        return {"error": "No text found in PDF"}

    # --- Create FAISS index for this PDF ---
    para_embs = embedding_model.encode(paragraphs, convert_to_numpy=True, normalize_embeddings=True)
    faiss_idx = faiss.IndexFlatIP(para_embs.shape[1])
    faiss_idx.add(para_embs)

    # --- Search query ---
    query_emb = embedding_model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = faiss_idx.search(query_emb, top_k)

    results = []
    for score, idx in zip(D[0], I[0]):
        para = paragraphs[idx]

        # Match paragraph to standard clauses for category info
        para_emb_std = embedding_model.encode([para], convert_to_numpy=True, normalize_embeddings=True)
        D_std, I_std = faiss_index.search(para_emb_std, top_k)
        categories = [metadata_clauses[i].get("category", "Unknown") for i in I_std[0]]
        top_category = Counter(categories).most_common(1)[0][0] if categories else "Unknown"

        results.append({
            "paragraph": para,
            "similarity": float(score),
            "top_category": top_category
        })

    # --- Generate confident LLM answer ---
    if llm:
        context_text = "\n".join([r["paragraph"] for r in results])
        prompt = f"""
You are a highly knowledgeable legal assistant. You are given a question and a set of extracted paragraphs from a contract.

Instructions:
1. Answer only using the provided paragraphs. Do not assume or infer anything beyond the text.
2. If the answer is explicitly stated in one of the paragraphs, quote the paragraph in your answer and answer confidently.
3. If multiple paragraphs are relevant, summarize them and explain clearly which clause addresses the question.
4. If the answer is not in the paragraphs, respond: "The contract does not explicitly state the answer."
5. Be concise, precise, and avoid vague language.
6. Use clause numbers if present in the paragraphs.

Question:
{query}

Context (extracted paragraphs):
{context_text}

Answer:
"""
        llm_response = llm.invoke(prompt)
        answer_text = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
    else:
        answer_text = "LLM not provided."

    return {
        "query": query,
        "answer": answer_text.strip(),
        "top_paragraphs": results
    }
    

def upload_and_query_pdf(file_path: str, query: str, top_k: int = 5, llm=None, save_dir="database/tmp_indexes") -> Dict:
    """
    Upload a PDF, build a dedicated FAISS index, and query only that PDF.
    Generates unique index names to prevent collisions.
    """
    os.makedirs(save_dir, exist_ok=True)

    # --- Unique ID for this PDF session ---
    session_id = str(uuid.uuid4())[:8]
    index_path = os.path.join(save_dir, f"{session_id}.index")
    meta_path = os.path.join(save_dir, f"{session_id}_meta.pkl")

    # --- Extract text using pdfplumber (more accurate) ---
    paragraphs = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            # Split by double newlines or line breaks, keep meaningful lines
            for line in text.split("\n"):
                if len(line.strip()) > 20:
                    paragraphs.append(line.strip())

    if not paragraphs:
        return {"error": "No readable text found in PDF."}

    # --- Build FAISS index for this PDF ---
    para_embs = embedding_model.encode(paragraphs, convert_to_numpy=True, normalize_embeddings=True)
    faiss_idx = faiss.IndexFlatIP(para_embs.shape[1])
    faiss_idx.add(para_embs)

    # Save index + metadata for potential reuse
    faiss.write_index(faiss_idx, index_path)
    with open(meta_path, "wb") as f:
        pickle.dump(paragraphs, f)

    # --- Query this specific index ---
    query_emb = embedding_model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = faiss_idx.search(query_emb, top_k)

    results = []
    for score, idx in zip(D[0], I[0]):
        results.append({
            "paragraph": paragraphs[idx],
            "similarity": float(score)
        })

    # --- LLM Answer Generation ---
    if llm:
        context_text = "\n".join([r["paragraph"] for r in results])
        prompt = f"""
You are a precise legal assistant. Use only the provided text to answer the question below.

Question:
{query}

Context (from contract):
{context_text}

Instructions:
- If the answer is explicit in a paragraph, quote that paragraph.
- If multiple paragraphs are relevant, summarize them.
- If not found, say "The contract does not explicitly mention this."
- Be concise and legal in tone.

Answer:
"""
        llm_response = llm.invoke(prompt)
        answer_text = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
    else:
        answer_text = "LLM not provided."

    return {
        "query": query,
        "answer": answer_text.strip(),
        "top_paragraphs": results,
        "index_path": index_path,
        "metadata_path": meta_path,
        "session_id": session_id
    }