# Nyay Sahayak 
Nyay Sahayak is a copilot for both upcoming and established lawyers. It helps in analysing and creating contracts, highlighting 

## Features

- **Legal Contract generation**: The platform uses a Retrieval-Augmented Generation (RAG)–based system to generate legally relevant contracts for businesses or for two individuals entering into a new partnership, ensuring the output is informed by applicable legal context and precedents.
- **Legal Research**: The platform enables users to research Indian law by highlighting specific sections or providing clear explanations of legal provisions, statutes, and regulations, helping users understand their scope and application. 
- **Legal Reasoning**: The platform allows users to upload a contract, after which the model analyzes the document and provides a detailed explanation of each clause, outlining its purpose, implications, and potential impact on the parties involved. 
- **Highlighting Sections from a Legal Contract**: Once a contract is created—or if you already have an existing contract—you can upload it to the system. The platform then analyzes the contract and identifies potential loopholes or ambiguous clauses that could be exploited by the other party.
- **User-friendly Interface**: Clean, modern UI built with React and Tailwind CSS

## Tech Stack

### Frontend
- React.js with Next.js
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Router
- RESTful API design

### AI / ML
- Retrieval-Augmented Generation (RAG) pipeline for legal analysis and contract generation
- LLaMA-based language model for clause explanation, legal reasoning, and contract drafting
- Vector-based document retrieval for contextual grounding

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Access to a LLaMA-based model
- Vector database or embedding store
- API keys or credentials
- npm or yarn

## How It Works

### Contract Upload or Creation
Users can upload an existing legal contract or create a new one through the platform. The document is securely processed and prepared for analysis.

### Clause-by-Clause Analysis
The system breaks the contract into individual clauses and uses a LLaMA-based language model to explain each clause in detail, outlining its intent, legal implications, and impact on the involved parties.

### Loophole and Risk Identification
The platform analyzes the contract to identify ambiguous language, missing safeguards, or potential loopholes that could be exploited by another party, helping users understand contractual risks early.

### Indian Law Research and Explanation
Users can research Indian legal provisions by highlighting specific sections or laws. The system retrieves relevant statutory context and provides clear explanations of applicable acts, sections, and interpretations.

### RAG-Based Contract Generation
For drafting new agreements, the platform uses a Retrieval-Augmented Generation (RAG) pipeline. Relevant legal documents and precedents are retrieved from a knowledge base and provided as context to the LLaMA model, enabling the generation of legally grounded contracts for businesses or individual partnerships.

