# rag_engine.py
import os
from dotenv import load_dotenv
from typing import Tuple, Callable
import re
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.retrievers import EnsembleRetriever, BM25Retriever
from langchain.prompts import PromptTemplate

load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

# Path to your FAISS database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_LOCAL_PATH = os.path.join(BASE_DIR, "database", "faiss_db_FULL2")  # FAISS DB folder

# -----------------------
# Load FAISS vectorstore
# -----------------------
def load_vectorstore() -> FAISS:
    from langchain_huggingface import HuggingFaceEmbeddings
    print("🔹 Loading sentence transformer embeddings for FAISS...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    print(f"🔹 Loading FAISS vectorstore from {DB_LOCAL_PATH}...")
    vector_store = FAISS.load_local(DB_LOCAL_PATH, embeddings, allow_dangerous_deserialization=True)
    print("✅ FAISS vectorstore loaded.")
    return vector_store

# -----------------------
# Build hybrid RetrievalQA chain
# -----------------------
def build_qa_chain(vector_store: FAISS) -> Tuple[RetrievalQA, Callable[[str], None]]:
    """
    Returns:
      - RetrievalQA chain
      - Logger function to print top 3 semantic matches
    """
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    # Hybrid retriever: semantic + keyword
    semantic_retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    keyword_retriever = BM25Retriever.from_documents(vector_store.docstore._dict.values())
    hybrid_retriever = EnsembleRetriever(
        retrievers=[semantic_retriever, keyword_retriever],
        weights=[0.7, 0.3]
    )

    # Prompt template for legal assistant
    prompt_template = PromptTemplate.from_template("""
You are India's Legal AI Assistant.
Answer strictly based on the retrieved legal texts below.
If a section or judgment is directly relevant, quote it accurately with citation.
If not found, reply: "Not available in the retrieved documents."

Question: {query}
Context:
{context}

Answer (include exact section text or judgment quote if present):
""")

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=hybrid_retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": prompt_template, "input_key": "query"},
        return_source_documents=True,
        input_key="query",
        output_key="result"
    )
    
    def log_top_matches(query: str):
        print("\n🔎 Query:", query)
        docs = semantic_retriever.get_relevant_documents(query)[:3]
        for i, doc in enumerate(docs, 1):
            meta = doc.metadata
            print(f" {i}. {meta.get('source')} | {meta.get('section_heading', meta.get('case_title', 'N/A'))}")

    print("✅ Hybrid RetrievalQA chain initialized successfully.")
    return qa_chain, log_top_matches


def preprocess_query(query: str) -> str:
    """Normalize section queries and enrich them with likely legal context."""

    q = query.strip()
    q = q.replace("Code of Criminal Procedure, 1973", "CrPC")
    q = q.replace("Code of Civil Procedure, 1908", "CPC")

    # --- Section number detection ---
    m = re.search(r"(Section\s*\d+[A-Za-z]*)", q)
    if not m:
        return q  # no section mentioned; return cleaned text

    sec = m.group(1)

    # --- Section-specific keyword enrichment (smart dictionary) ---
    crpc_keywords = {
        "41": "CrPC arrest without warrant police powers procedure rights of accused",
        "41A": "CrPC notice of appearance arrest procedure safeguards rights",
        "125": "CrPC maintenance of wife children parents alimony dependent spouse rights",
        "161": "CrPC witness statement police examination investigation rights",
        "167": "CrPC police custody remand investigation magistrate production time limit 24 hours",
        "173": "CrPC investigation completion final report charge sheet police report",
        "438": "CrPC anticipatory bail arrest protection pre-arrest conditions",
        "439": "CrPC regular bail powers of high court sessions court",
    }

    cpc_keywords = {
        "9": "CPC jurisdiction civil suit maintainability court competence",
        "10": "CPC stay of suit res sub judice pending litigation",
        "11": "CPC res judicata finality of judgment previous suit bar",
        "80": "CPC notice to government or public officer before suit",
        "100": "CPC second appeal substantial question of law",
        "151": "CPC inherent powers of court justice equity procedure",
    }

    # --- Assign enriched query based on context ---
    if "CrPC" in q or "Criminal" in q:
        sec_num = re.sub(r"\D", "", sec)
        add = crpc_keywords.get(sec_num, "CrPC criminal procedure law India explanation meaning")
        q = f"{sec} {add}"
    elif "CPC" in q or "Civil" in q:
        sec_num = re.sub(r"\D", "", sec)
        add = cpc_keywords.get(sec_num, "CPC civil suit procedure appeal decree order jurisdiction")
        q = f"{sec} {add}"
    else:
        q = f"{sec} Indian law legal meaning explanation interpretation"

    return q.strip()

    
if __name__ == "__main__":
    vs = load_vectorstore()
    chain, logger = build_qa_chain(vs)
    print("✅ System ready for queries.")
    logger("Section 125 CrPC maintenance of wife and children")