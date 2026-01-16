# backend_app.py
from flask import request, jsonify
# from process_contract_pdf import analyze_contract_risk
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import traceback
import json
from rag_engine import (
    build_qa_chain,
    preprocess_query,
    load_vectorstore
)
from process_contract_pdf import process_contract
from dotenv import load_dotenv
load_dotenv()
from pdf_utils import save_contract_as_pdf
from legal_utils import (
    read_contract_pdf,
    analyze_contract_pdf_file,
    highlight_non_standard_paragraphs,
    summarize_contract_sections,
    cluster_clauses,
    search_contract,
    llm,
    query_pdf_with_faiss,
    generate_contract
)
from rag_utils import build_faiss_for_pdf, query_pdf_faiss
from legal_utils import llm
vector_store = load_vectorstore()
qa_chain, log_top_matches = build_qa_chain(vector_store)

app = Flask(__name__)

# Configure CORS to allow all origins and methods (for development)
# In production, you should restrict this to specific origins
CORS(app, 
     resources={r"/*": {
         "origins": "*",  # Allow all origins for development
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
         "expose_headers": ["Content-Type"],
         "max_age": 3600
     }},
     supports_credentials=False)  # Set to False when using wildcard origins

# Add a global OPTIONS handler to ensure preflight requests are handled
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.status_code = 200
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response

@app.route("/api/data")
def get_data():
    return jsonify({"message": "Connected across devices"})

# ---------------- CONFIG ----------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ALLOWED_EXTENSIONS = {'pdf'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------- HEALTH ----------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Backend running successfully."})

#Generates contract in pdf form
@app.route("/generate-contract-pdf", methods=["POST"])
def generate_contract_pdf():
    try:
        data = request.get_json(force=True, silent=True) or {}
        contract_type = data.get("contract_type", "Consulting Agreement")
        parties = data.get("parties", {})
        terms = data.get("terms", {})

        if not parties or not terms:
            return jsonify({"error": "Missing 'parties' or 'terms'"}), 400

        # Generate contract text
        contract_text = generate_contract(contract_type, parties, terms, llm)

        # Save as PDF
        pdf_path = f"outputs/{parties.get('party_a','party')}_contract.pdf"
        save_contract_as_pdf(contract_text, pdf_path)

        return jsonify({"contract_text": contract_text, "pdf_path": pdf_path})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- HIGHLIGHT NON-STANDARD ----------------
@app.route("/highlight", methods=["POST"])
def highlight():
    try:
        data = request.get_json(force=True, silent=True) or {}
        file_path = data.get("file_path")
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": f"File not found: {file_path}"}), 404

        # Read full contract text
        contract_text = read_contract_pdf(file_path)

        # Call the fixed helper with reason included
        result = highlight_non_standard_paragraphs(contract_text)

        # Return everything: paragraph, classification, reason, confidence, top clauses
        return jsonify({"paragraph_analysis": result})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- SUMMARIZE CONTRACT ----------------
@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json(force=True, silent=True) or {}
        file_path = data.get("file_path")
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": f"File not found: {file_path}"}), 404

        contract_text = read_contract_pdf(file_path)
        summaries = summarize_contract_sections(contract_text)
        return jsonify({"summaries": summaries})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- CLUSTER CLAUSES ----------------
@app.route("/cluster", methods=["GET"])
def cluster():
    try:
        n_clusters = int(request.args.get("n_clusters", 10))
        clusters = cluster_clauses(n_clusters)
        # return only top 3 clauses per cluster for brevity
        simplified_clusters = {k: v[:3] for k, v in clusters.items()}
        return jsonify({"clusters": simplified_clusters})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- SEMANTIC SEARCH ----------------
@app.route("/search", methods=["POST"])
def search():
    try:
        data = request.get_json(force=True, silent=True) or {}
        query = data.get("query", "")
        if not query:
            return jsonify({"error": "Missing 'query' field"}), 400

        result = search_contract(query)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- ANALYZE CONTRACT (FULL PDF) ----------------
@app.route("/analyze-contract", methods=["POST"])
def analyze_contract():
    try:
        # Check for file upload
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
            else:
                return jsonify({"error": "Invalid file. Only PDF allowed."}), 400
        else:
            data = request.get_json(force=True, silent=True) or {}
            filepath = data.get("file_path")
            if not filepath or not os.path.exists(filepath):
                return jsonify({"error": f"File not found: {filepath}"}), 404

        result = analyze_contract_pdf_file(filepath)

        # Cleanup uploaded file
        if filepath.startswith(UPLOAD_FOLDER):
            os.remove(filepath)

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- QUERY PDF (FAISS + LLM) ----------------
@app.route("/query-pdf", methods=["POST"])
def query_pdf():
    try:
        top_k = int(request.form.get("top_k", 5))

        # File upload via form-data
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
            else:
                return jsonify({"error": "Invalid file. Only PDF allowed."}), 400
        else:
            data = request.get_json(force=True, silent=True) or {}
            filepath = data.get("file_path", "")
            if not filepath or not os.path.exists(filepath):
                return jsonify({"error": f"File not found: {filepath}"}), 404

        data = request.form if 'file' in request.files else request.get_json(force=True, silent=True)
        query_text = data.get("query", "")
        if not query_text:
            return jsonify({"error": "Missing 'query'"}), 400

        # Call helper from legal_utils.py
        result = query_pdf_with_faiss(filepath, query_text, top_k, llm=llm)

        # Cleanup uploaded file
        if filepath.startswith(UPLOAD_FOLDER):
            os.remove(filepath)

        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- BUILD NEW EMBEDDINGS ----------------
@app.route("/build-pdf-index", methods=["POST"])
def build_pdf_index():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        file = request.files['file']
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF allowed"}), 400
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        index_name = build_faiss_for_pdf(filepath)
        return jsonify({"message": f"Index built for {filename}", "index_name": index_name})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- QUERY NEW EMBEDDINGS ----------------
@app.route("/query-new-pdf", methods=["POST"])
def query_new_pdf():
    try:
        top_k = int(request.form.get("top_k", 5))
        if 'file' in request.files:
            file = request.files['file']
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
        else:
            data = request.get_json(force=True, silent=True) or {}
            filepath = data.get("file_path")

        if not os.path.exists(filepath):
            return jsonify({"error": f"File not found: {filepath}"}), 404

        query = request.form.get("query") or (data.get("query") if data else "")
        if not query:
            return jsonify({"error": "Missing query"}), 400

        faiss_result = query_pdf_faiss(filepath, query, top_k)

        # Combine top chunks and send to Groq LLM
        context = "\n\n".join([r["chunk"] for r in faiss_result["results"]])
        prompt = f"""
        You are a legal document analyst.
        Based on the following context extracted from a contract, answer the question clearly.

        Context:
        {context}

        Question: {query}

        Answer:
        """
        answer = llm.invoke(prompt).content

        return jsonify({
            "query": query,
            "answer": answer,
            "top_chunks": faiss_result["results"]
        })
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/upload-query-pdf", methods=["POST"])
def upload_query_pdf():
    try:
        top_k = int(request.form.get("top_k", 5))
        query_text = request.form.get("query", "")
        if not query_text:
            return jsonify({"error": "Missing query"}), 400

        # File upload
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)
        if not filename.lower().endswith(".pdf"):
            return jsonify({"error": "Invalid file. Only PDF allowed."}), 400

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # --- Combined upload+index+query ---
        from legal_utils import upload_and_query_pdf
        result = upload_and_query_pdf(filepath, query_text, top_k, llm=llm)

        # Optional cleanup (comment out if you want to persist indexes)
        # os.remove(filepath)

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/query", methods=["POST"])
def query():
    try:
        # --- Read and preprocess the query ---
        data = request.get_json(force=True, silent=True) or {}
        user_query = data.get("query", "") or data.get("question", "")
        processed_query = preprocess_query(user_query)

        print(f"\n🧠 User Query: {user_query}")
        print(f"🔍 Processed Query: {processed_query}")

        # --- Retrieve top matching docs for transparency ---
        log_top_matches(processed_query)

        # --- Universal model call ---
        print("🔧 Running RAG pipeline...")

        try:
            # 1️⃣ try the common case (query)
            response = qa_chain.invoke({"query": processed_query})
        except Exception as e1:
            try:
                # 2️⃣ fallback (question)
                response = qa_chain.invoke({"question": processed_query})
            except Exception as e2:
                # 3️⃣ last-resort manual call
                print("⚠️ Using manual fallback LLM call")
                docs = qa_chain.retriever.get_relevant_documents(processed_query)
                context = "\n\n".join([d.page_content for d in docs[:5]])
                prompt = f"Question: {processed_query}\n\nContext:\n{context}"
                answer_text = qa_chain.combine_documents_chain.llm_chain.llm.invoke(prompt)
                response = {"result": str(answer_text), "source_documents": docs}

        # --- Extract results ---
        answer = response.get("result", "No answer generated.")
        source_docs = response.get("source_documents", [])

        sources = []
        for doc in source_docs:
            meta = doc.metadata or {}
            doc_type = meta.get("type", "unknown")
            title = meta.get("section_heading", meta.get("case_title", "N/A"))
            preview = doc.page_content[:200].replace("\n", " ")

            sources.append({
                "type": doc_type,
                "file": meta.get("source", "unknown"),
                "title": title,
                "preview": preview,
                "link": meta.get("pdf_url", None)   # ✅ Add this line
            })


        return jsonify({
            "query": user_query,
            "answer": answer.strip(),
            "sources": sources
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)})

# ---------------- RUN APP ----------------

# ---------------- ANALYZE CONTRACT FOR EXPLOITATION ----------------

# ---------------- ANALYZE CONTRACT FOR EXPLOITATION ----------------

# ---------------- ANALYZE CONTRACT FOR EXPLOITATION ----------------
from process_contract_pdf import process_contract

@app.route("/analyze-exploit", methods=["POST"])
def analyze_exploit():
    try:
        # 1. file upload
        if "file" not in request.files:
            return jsonify({"error": "No PDF uploaded"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)
        if not filename.lower().endswith(".pdf"):
            return jsonify({"error": "Invalid file. Only PDF allowed."}), 400

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # 2. parse use_rag and top_k
        use_rag = True
        if request.form.get("use_rag") is not None:
            use_rag = request.form.get("use_rag", "true").lower() == "true"
        else:
            data = request.get_json(force=True, silent=True) or {}
            if "use_rag" in data:
                use_rag = bool(data.get("use_rag"))

        top_k = int(request.form.get("top_k", 3)) if request.form.get("top_k") else int(request.args.get("top_k", 3))

        # 3. Run analysis (single LLM call inside)
        result = process_contract(filepath, use_rag=use_rag, top_k=top_k, max_clauses_in_prompt=20)

        # optional: cleanup file if you want
        # if filepath.startswith(UPLOAD_FOLDER):
        #     os.remove(filepath)

        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
