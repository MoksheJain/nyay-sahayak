# rag_utils.py
import os
import pdfplumber
import numpy as np
import faiss
import pickle
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

# ------------------------------
# CONFIG
# ------------------------------
EMBED_MODEL = "BAAI/bge-large-en-v1.5"
INDEX_DIR = "indexes"
os.makedirs(INDEX_DIR, exist_ok=True)
model = SentenceTransformer(EMBED_MODEL)

# ------------------------------
# 1️⃣ Extract + Chunk PDF
# ------------------------------
def extract_and_chunk_pdf(file_path: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
    chunks = splitter.split_text(text)
    return [c.strip() for c in chunks if len(c.strip()) > 20]

# ------------------------------
# 2️⃣ Build FAISS index for PDF
# ------------------------------
def build_faiss_for_pdf(file_path: str) -> str:
    chunks = extract_and_chunk_pdf(file_path)
    embeddings = model.encode(chunks, convert_to_numpy=True, normalize_embeddings=True)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    index_name = os.path.splitext(os.path.basename(file_path))[0]
    faiss.write_index(index, f"{INDEX_DIR}/{index_name}.index")

    with open(f"{INDEX_DIR}/{index_name}_meta.pkl", "wb") as f:
        pickle.dump(chunks, f)

    return index_name

# ------------------------------
# 3️⃣ Query FAISS index
# ------------------------------
def query_pdf_faiss(file_path: str, query: str, top_k: int = 5) -> Dict:
    index_name = os.path.splitext(os.path.basename(file_path))[0]
    index_path = f"{INDEX_DIR}/{index_name}.index"
    meta_path = f"{INDEX_DIR}/{index_name}_meta.pkl"

    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise ValueError("FAISS index not found for this PDF. Run build_faiss_for_pdf() first.")

    index = faiss.read_index(index_path)
    with open(meta_path, "rb") as f:
        chunks = pickle.load(f)

    q_emb = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index.search(q_emb, top_k)

    results = []
    for score, idx in zip(D[0], I[0]):
        results.append({
            "chunk": chunks[idx],
            "similarity": float(score)
        })

    return {"query": query, "results": results}