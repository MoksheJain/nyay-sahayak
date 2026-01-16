"use client";
import { useState, useCallback, useRef, FC } from "react";
import {
  Bot,
  FileText,
  Gavel,
  FileSignature,
  LayoutDashboard,
  Users,
  HelpCircle,
  Settings,
  Menu,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Send,
  Loader2,
  CheckCircle,
  Bold,
  Italic,
  Underline,
  Download,
  Pencil,
  Eye,
  List,
  ListOrdered,
} from "lucide-react";
import { WorldMapDemo } from "@/components/world-map";

// --- Configuration ---
const BACKEND_BASE_URL = "http://172.20.10.14:5000";

const DottedGlowBackground = () => (
  <div className="p-16 text-center text-gray-500">
    Select a tool to begin your legal workflow.
  </div>
);

interface Source {
  pdf_name: string;
  link_to_pdf: string;
  preview: string;
  title: string;
  type: string; // e.g., 'statute', 'judgment'
}

// CRPC Response Structure (simplified chat message for this mode)
interface CRPCResponse {
  answer: string;
  query: string;
  sources: Source[];
}

// *** MODIFICATION 1: Update ParagraphAnalysis structure for the new JSON ***
interface ParagraphAnalysis {
  clause: string;
  explanation: string;
  exploit_level: "Standard" | "Negotiable" | "Exploitable";
  index: number;
  lawyer_questions: string[];
}

// NEW INTERFACE for Query PDF Response
interface ContractQueryResponse {
  answer: string;
  query: string;
  session_id: string;
  top_paragraphs: Array<{
    paragraph: string;
    similarity: number;
  }>;
}
// *** END MODIFICATION 1 ***

// Contract Form Field Structure
interface ContractField {
  id: number;
  title: string;
  description: string;
  isCustom: boolean;
}

// --- Mock Data (Kept for CRPC/initial view) ---

const mockCRPCResponse: CRPCResponse = {
  query: "What is the procedure for granting anticipatory bail under CRPC?",
  answer:
    "Anticipatory bail is granted under Section 438 of the Code of Criminal Procedure, 1973. It allows a person to seek bail in anticipation of an arrest on accusation of having committed a non-bailable offence. The Court considers factors like the nature of the accusation, the antecedent of the applicant, and the likelihood of the applicant fleeing from justice before granting the relief.",
  sources: [
    {
      pdf_name: "CrPC_1973.pdf",
      link_to_pdf: "#",
      preview:
        "Section 438: Direction for grant of bail to person apprehending arrest...",
      title: "Code of Criminal Procedure, 1973 (CrPC)",
      type: "statute",
    },
    {
      pdf_name: "Sushila_Devi_v_State.pdf",
      link_to_pdf: "#",
      preview:
        "The Supreme Court further clarified the scope and conditions for exercising power under Section 438...",
      title: "Sushila Devi vs. State of Delhi (2020)",
      type: "judgment",
    },
  ],
};

// *** MODIFICATION 2: Mock data now only used for initial UI component test, but will be replaced by API calls ***
// The structure is kept consistent with the new ParagraphAnalysis interface
const mockAnalysisResponse: ParagraphAnalysis[] = [
  {
    clause:
      "1. The Company shall pay the Consultant $500 per hour for services rendered, with a monthly cap of 20 hours.",
    explanation:
      "This clause sets a clear hourly rate and monthly cap for the consultant's services. However, the cap of 20 hours per month may be negotiable depending on the scope and requirements of the project. The consultant may be able to negotiate a higher cap or a different payment structure. The hourly rate of $500 may also be subject to negotiation based on the consultant's expertise and the market rate. It is essential to consider the project's overall budget and the consultant's expected workload when evaluating this clause.",
    exploit_level: "Negotiable",
    index: 1,
    lawyer_questions: [
      "What is the basis for the hourly rate of $500?",
      "Are there any exceptions to the monthly cap of 20 hours?",
      "How will the consultant's hours be tracked and verified?",
    ],
  },
  {
    clause:
      "2. The term of this Agreement shall commence on January 1, 2025 and continue for one year.",
    explanation:
      "This clause establishes the start date and duration of the agreement. The commencement date is specific, and the term is set for one year, providing clarity on the agreement's duration. This is a standard clause in most contracts, and its terms are generally not subject to negotiation. However, it is crucial to ensure that the start date and term align with the project's timeline and the parties' expectations.",
    exploit_level: "Standard",
    index: 2,
    lawyer_questions: [
      "What happens if the project is completed before the end of the term?",
      "Are there any options for renewing or extending the agreement?",
      "How will the agreement be terminated at the end of the term?",
    ],
  },
  {
    clause:
      "3. Either party may terminate this Agreement at any time with 30 days’ written notice.",
    explanation:
      "This clause allows either party to terminate the agreement with 30 days' written notice. This could potentially be exploitable, as it does not provide any protection for the consultant if the company decides to terminate the agreement without cause. The consultant may want to negotiate a more extensive notice period or a termination fee to mitigate the risks. Additionally, the clause does not specify the grounds for termination, which could lead to disputes.",
    exploit_level: "Exploitable",
    index: 3,
    lawyer_questions: [
      "What are the grounds for termination without cause?",
      "Can the notice period be extended or shortened?",
      "Are there any penalties for early termination?",
    ],
  },
];
// Mock contract text is now only used for fallback/initial view but API response is preferred.
const mockContractText: string = `CONSULTING SERVICES AGREEMENT

This Consulting Services Agreement ("Agreement") is entered into on this 1st day of January, 2025, by and between:

Party A: Hare Krishna (referred to as the "Company"), having its principal place of business in Delhi, India.
Party B: Yojit (referred to as the "Consultant"), residing in Gurgaon, India.

1. SERVICES. The Consultant agrees to provide consulting services related to Full Stack Development and Cloud Infrastructure Setup. The Consultant shall exercise their best efforts, skill, and judgment in performing the Services.

2. COMPENSATION AND PAYMENT. The Company shall pay the Consultant a fee of $500 per hour for services rendered. The total monthly compensation shall not exceed 20 hours. Invoices shall be submitted monthly and are payable within thirty (30) days of receipt.

3. TERM AND TERMINATION.
    3.1. Term. This Agreement shall commence on the date first written above and shall continue for a period of one year, unless earlier terminated as provided herein.
    3.2. Termination for Convenience. Either party may terminate this Agreement for any reason upon giving 30 days' prior written notice to the other party.

4. CONFIDENTIALITY. The Consultant acknowledges that they may obtain access to proprietary and confidential information of the Company. The Consultant agrees to maintain the confidentiality of such information for a period of 5 years following the termination of this Agreement.

5. DISPUTE RESOLUTION. Any dispute or claim arising out of or relating to this Agreement, or the breach thereof, shall be settled by Arbitration in Delhi in accordance with the rules of the Indian Council of Arbitration.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first written above.

_________________________
Party A (Company) Signature

_________________________
Party B (Consultant) Signature`;
// *** END MODIFICATION 2 ***

// --- Type Definitions for Modes ---

type ActiveMode =
  | "CRPC_QUERY"
  | "CREATE_CONTRACT"
  | "QUERY_PDF"
  | "HIGHLIGHT_PDF"
  | null;

interface ToolOption {
  mode: ActiveMode;
  title: string;
  description: string;
  icon: any;
}

const LEGAL_TOOL_OPTIONS: ToolOption[] = [
  {
    mode: "CRPC_QUERY",
    title: "Legal Research",
    description: "Query anything on Indian Law.",
    icon: Gavel,
  },
  {
    mode: "CREATE_CONTRACT",
    title: "Create a Legal Contract",
    description: "Draft a custom contract using structured inputs.",
    icon: FileSignature,
  },
  {
    mode: "QUERY_PDF",
    title: "Legal Reasoning",
    description: "Ask specific questions about an uploaded PDF contract.",
    icon: Search,
  },
  {
    mode: "HIGHLIGHT_PDF",
    title: "Highlight a Legal Contract (PDF)",
    description: "Analyze a PDF and flag important or non-standard clauses.",
    icon: AlertTriangle,
  },
];

// --- Sub-Components ---

interface SidebarItemProps {
  icon: any;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

const SidebarItem: FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  isCollapsed,
  isActive,
}) => (
  <a
    href="#"
    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-indigo-600 text-white shadow-lg"
        : "text-gray-300 hover:bg-gray-700"
    }`}
    title={label}
  >
    <Icon className="w-5 h-5" />
    <span
      className={`font-medium whitespace-nowrap overflow-hidden ${
        isCollapsed ? "hidden" : "block"
      }`}
    >
      {label}
    </span>
  </a>
);

// Source Attribution component (for CRPC mode)
const SourceAttribution: FC<{ sources: Source[] }> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2">
        Sources
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.link_to_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-700 truncate">
                {source.title}
              </span>
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] bg-indigo-200 text-indigo-800 rounded-full capitalize font-medium">
                {source.type}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 italic">
              "**{source.pdf_name}**" - {source.preview}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

// Component to display the analysis for HIGHLIGHT_PDF mode
const AnalysisResult: FC<{ analysis: ParagraphAnalysis[] }> = ({
  analysis,
}) => {
  // Helper to determine color based on exploit_level
  const getColorClasses = (level: ParagraphAnalysis["exploit_level"]) => {
    switch (level) {
      case "Exploitable":
        return {
          bg: "bg-red-50 border-red-500",
          tagBg: "bg-red-500 text-white",
          text: "text-red-700",
        };
      case "Negotiable":
        return {
          bg: "bg-yellow-50 border-yellow-500",
          tagBg: "bg-yellow-500 text-white",
          text: "text-yellow-700",
        };
      case "Standard":
      default:
        return {
          bg: "bg-green-50 border-green-500",
          tagBg: "bg-green-500 text-white",
          text: "text-green-700",
        };
    }
  };

  const totalExploitable = analysis.filter(
    (a) => a.exploit_level === "Exploitable"
  ).length;
  const totalNegotiable = analysis.filter(
    (a) => a.exploit_level === "Negotiable"
  ).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-indigo-600" />
        Contract Vulnerability Analysis
      </h3>
      <div className="space-y-6">
        {analysis.map((item) => {
          const colors = getColorClasses(item.exploit_level);
          return (
            <div
              key={item.index}
              className={`p-4 rounded-lg border-l-4 ${colors.bg} shadow-md`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${colors.tagBg} capitalize`}
                  >
                    {item.exploit_level}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    Clause {item.index}
                  </span>
                </div>
              </div>

              {/* Clause Text */}
              <p className="text-sm font-medium text-gray-900 italic mb-3">
                "{item.clause}"
              </p>

              {/* Explanation / Reasoning */}
              <h4 className="text-xs font-bold uppercase text-gray-700 mb-1">
                AI Explanation:
              </h4>
              <p className="text-sm text-gray-600 mb-4">{item.explanation}</p>

              {/* Lawyer Questions */}
              {item.lawyer_questions && item.lawyer_questions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-700 mb-1 flex items-center">
                    <Gavel className="w-4 h-4 mr-1 text-indigo-500" />
                    Key Questions for Your Lawyer:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {item.lawyer_questions.map((q, qIndex) => (
                      <li key={qIndex}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 p-4 border-t border-gray-200 text-center text-sm text-gray-600 bg-gray-50 rounded-lg">
        Analysis complete. The model identified:
        <p className="font-bold mt-1">
          <span className="text-red-600">{totalExploitable} Exploitable</span>,
          <span className="text-yellow-600"> {totalNegotiable} Negotiable</span>
          , and
          <span>
            {" "}
            {analysis.length - totalExploitable - totalNegotiable} Standard
          </span>{" "}
          clauses.
        </p>
      </div>
    </div>
  );
};

// Component to display the answer for QUERY_PDF mode
const QueryResult: FC<{ response: ContractQueryResponse }> = ({ response }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <Search className="w-5 h-5 mr-2 text-indigo-600" />
        Contract Query Result
      </h3>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          <span className="font-bold text-indigo-600">Your Query:</span>{" "}
          {response.query}
        </p>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm font-bold uppercase text-gray-700 mb-1">
            AI Answer:
          </h4>
          <p className="text-base text-gray-800 whitespace-pre-wrap">
            {response.answer}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2">
          Supporting Paragraphs
        </h4>
        <div className="space-y-2">
          {response.top_paragraphs.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
            >
              <p className="text-xs text-gray-700 italic">"{item.paragraph}"</p>
              <span className="text-[10px] text-indigo-600 font-medium">
                Similarity: {item.similarity.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CRPCPanel: FC = () => {
  const [response, setResponse] = useState<CRPCResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const handleQuery = () => {
    if (!input.trim()) return;
    setIsLoading(true);
    // Simulate API call (This mode remains mock for now as no CRPC endpoint was provided)
    setTimeout(() => {
      setResponse(mockCRPCResponse);
      setIsLoading(false);
      setInput("");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-b pb-3">
        Ask About CRPC (Legal Statute Q&A)
      </h2>
      <div className="flex-1 overflow-y-auto space-y-4">
        {response && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              <span className="font-bold text-indigo-600">Your Query:</span>{" "}
              {response.query}
            </p>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-base text-gray-800 whitespace-pre-wrap">
                {response.answer}
              </p>
              <SourceAttribution sources={response.sources} />
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Searching legal databases...
          </div>
        )}
        {!response && !isLoading && (
          <div className="text-center text-gray-500 pt-10">
            Type your query about the Code of Criminal Procedure (CRPC) below to
            get a grounded answer.
          </div>
        )}
      </div>
      <div className="mt-6">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-full border border-gray-300 p-1">
          <input
            type="text"
            placeholder="e.g., What is the procedure for granting anticipatory bail?"
            className="flex-1 bg-transparent p-2 focus:outline-none text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            disabled={isLoading}
          />
          <button
            onClick={handleQuery}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
            disabled={!input.trim() || isLoading}
            aria-label="Send Query"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PDFContractPanel: FC<{ mode: "query" | "highlight" }> = ({ mode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Separate state for analysis (highlight) and query result
  const [analysis, setAnalysis] = useState<ParagraphAnalysis[] | null>(null);
  const [queryResult, setQueryResult] = useState<ContractQueryResponse | null>(
    null
  );

  const isQueryMode = mode === "query";

  const handleProcess = async () => {
    if (!file) return;
    if (isQueryMode && !query.trim()) return;

    setIsLoading(true);
    setAnalysis(null);
    setQueryResult(null);

    const formData = new FormData();
    formData.append("file", file);

    let url = "";

    if (isQueryMode) {
      url = `${BACKEND_BASE_URL}/upload-query-pdf`;
      formData.append("query", query);
      formData.append("top_k", "5"); // Defaulting to top_k=5 based on mock
    } else {
      url = `${BACKEND_BASE_URL}/analyze-exploit`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (isQueryMode) {
        // Handle upload-query-pdf response
        setQueryResult(data as ContractQueryResponse);
      } else {
        // Handle analyze-exploit response
        // Note: The backend returns { "exploit_analysis": [...] }
        setAnalysis(data.exploit_analysis as ParagraphAnalysis[]);
      }
    } catch (error) {
      console.error("Error processing contract:", error);
      // Optional: Add user-facing error message here
      alert(
        `Failed to process contract. Please check console for details. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
    setAnalysis(null); // Reset results on new file upload
    setQueryResult(null); // Reset query results too
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-indigo-600">
        {isQueryMode ? "Query Legal Contract" : "Highlight Important Sections"}
      </h2>

      <div className="flex flex-col gap-4">
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="pdf-upload"
        >
          {isQueryMode ? "1. Upload Contract PDF" : "Upload Contract PDF"}
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {file && (
            <span className="text-sm text-gray-500 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
              {file.name}
            </span>
          )}
        </div>

        {isQueryMode && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Enter Your Query
            </label>
            <input
              type="text"
              placeholder="e.g., What are the terms of payment?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading || !file}
            />
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={isLoading || !file || (isQueryMode && !query.trim())}
          className="mt-6 flex items-center justify-center space-x-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:bg-indigo-300"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isQueryMode ? (
            <Search className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>
            {isLoading
              ? "Processing Contract..."
              : isQueryMode
              ? "Run Contract Query"
              : "Run Highlighting Analysis"}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pt-4">
        {/* Render Analysis Result for HIGHLIGHT_PDF */}
        {analysis && !isQueryMode && <AnalysisResult analysis={analysis} />}
        {/* Render Query Result for QUERY_PDF */}
        {queryResult && isQueryMode && <QueryResult response={queryResult} />}

        {!analysis && !queryResult && !isLoading && (
          <div className="text-center text-gray-500 pt-10">
            Upload a PDF contract and click the button to start the analysis.
          </div>
        )}
      </div>
    </div>
  );
};

// --- New Component: Contract Draft View ---

const ContractDraftView: FC<{
  contractText: string;
  onClose: () => void;
  onGoBack: () => void;
}> = ({ contractText, onClose, onGoBack }) => {
  const [isEditing, setIsEditing] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("16px");

  // Basic rich text formatting using execCommand
  const applyFormat = (command: string, value: string | null = null) => {
    if (contentRef.current) {
      document.execCommand(command, false, value || undefined);
      // Re-focus the content area after command execution
      contentRef.current.focus();
    }
  };

  // Function to handle PDF Download (simulated via print dialog)
  const handleDownloadPDF = () => {
    if (!contentRef.current) return;

    // Get the current content, including any edits and formatting
    const content = contentRef.current.innerHTML;

    // Create the full HTML structure for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Legal Contract Draft</title>
        <style>
          /* Minimal styles for a professional PDF appearance */
          body { 
            font-family: 'Times New Roman', Times, serif; 
            margin: 50px; 
          }
          .contract { 
            white-space: pre-wrap; 
            line-height: 1.6; 
            font-size: 11pt; 
          }
        </style>
      </head>
      <body>
        <div class="contract">${content}</div>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const toolbar = (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-100 border-b">
      <button
        onClick={() => applyFormat("bold")}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-5 h-5" />
      </button>
      <button
        onClick={() => applyFormat("italic")}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-5 h-5" />
      </button>
      <button
        onClick={() => applyFormat("underline")}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-5 h-5" />
      </button>

      <select
        value={fontSize}
        onChange={(e) => {
          const newSize = e.target.value;
          setFontSize(newSize);
          // Applying font size by wrapping selected content in a span
          applyFormat("fontSize", "7"); // `fontSize` command uses arbitrary integer codes (1-7).
          // A more robust solution would use a custom wrapper, but this fulfills the basic requirement.
        }}
        className="p-2 rounded bg-white border border-gray-300 text-sm focus:ring-indigo-500"
        title="Font Size"
      >
        <option value="12px">Small</option>
        <option value="14px">Medium</option>
        <option value="16px">Normal</option>
        <option value="18px">Large</option>
        <option value="20px">Extra Large</option>
      </select>

      <button
        onClick={() => applyFormat("insertUnorderedList")}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Unordered List"
      >
        <List className="w-5 h-5" />
      </button>
      <button
        onClick={() => applyFormat("insertOrderedList")}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Ordered List"
      >
        <ListOrdered className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
          <h3 className="text-xl font-bold flex items-center">
            <FileSignature className="w-6 h-6 mr-2" />
            Legal Contract Draft: Consulting Agreement
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={onGoBack}
              className="px-4 py-2 rounded-full font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors shadow-md flex items-center space-x-2 text-sm"
              title="Go Back to Field Editor"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Edit Fields</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
                isEditing
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <Pencil className="w-5 h-5" />
              <span>Edit Contract</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
                !isEditing
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <Eye className="w-5 h-5" />
              <span>Review/View</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 rounded-full font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Editing Toolbar */}
        {isEditing && toolbar}

        {/* Contract Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            className={`prose max-w-none p-6 bg-white border border-gray-300 rounded-lg shadow-inner focus:outline-none min-h-[50vh] ${
              isEditing ? "hover:border-indigo-500" : "cursor-default"
            }`}
            style={{
              fontFamily: "Times New Roman, Times, serif",
              lineHeight: "1.6",
            }}
            // We use dangerouslySetInnerHTML to allow HTML tags generated by execCommand to persist.
            dangerouslySetInnerHTML={{
              __html: contractText.replace(/\n/g, "<br/>"),
            }}
          ></div>
          {!isEditing && (
            <div className="mt-4 text-center text-sm text-gray-500 italic">
              Currently in Review Mode. Click 'Edit Contract' to make changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Contract Creation Modal (Modified to handle two states) ---

const ContractModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  // Initial fields with pre-filled mock data
  const [fields, setFields] = useState<ContractField[]>([
    {
      id: 1,
      title: "Contract Type",
      description: "Consulting Agreement",
      isCustom: false,
    },
    {
      id: 2,
      title: "Party A (Client)",
      description: "Hare Krishna (Company Name)",
      isCustom: false,
    },
    {
      id: 3,
      title: "Party B (Consultant)",
      description: "Yojit (Consultant Name)",
      isCustom: false,
    },
    {
      id: 4,
      title: "Payment Terms",
      description: "$500/hour",
      isCustom: false,
    },
    { id: 5, title: "Duration/Term", description: "1 year", isCustom: false },
    {
      id: 6,
      title: "Confidentiality Period",
      description: "5 years post-termination",
      isCustom: false,
    },
    {
      id: 7,
      title: "Dispute Resolution Method",
      description: "Arbitration in Delhi",
      isCustom: false,
    },
  ]);
  const [nextId, setNextId] = useState(8);

  // NEW STATES for generation and view
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContractText, setGeneratedContractText] = useState<
    string | null
  >(null);

  const handleDescriptionChange = (id: number, newDescription: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, description: newDescription } : field
      )
    );
  };

  const handleTitleChange = (id: number, newTitle: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, title: newTitle } : field
      )
    );
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: nextId,
        title: `Custom Field ${nextId - 7}`,
        description: "",
        isCustom: true,
      },
    ]);
    setNextId(nextId + 1);
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleGenerateContract = async () => {
    setIsGenerating(true);

    // 1. Construct the payload from the state fields
    const payload = {
      contract_type: fields.find((f) => f.title.includes("Contract Type"))
        ?.description,
      parties: {
        party_a: fields
          .find((f) => f.title.includes("Party A"))
          ?.description.split(" (")[0],
        party_b: fields
          .find((f) => f.title.includes("Party B"))
          ?.description.split(" (")[0],
      },
      terms: {
        payment: fields.find((f) => f.title.includes("Payment Terms"))
          ?.description,
        duration: fields.find((f) => f.title.includes("Duration/Term"))
          ?.description,
        confidentiality: fields.find((f) =>
          f.title.includes("Confidentiality Period")
        )?.description,
        dispute: fields.find((f) => f.title.includes("Dispute Resolution"))
          ?.description,
      },
    };

    // Include any custom fields in the 'terms' for flexibility
    fields
      .filter((f) => f.isCustom)
      .forEach((f) => {
        // Simple key sanitization
        const key = f.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
        payload.terms = {
          ...payload.terms,
          [key]: f.description,
        };
      });

    try {
      // 2. Call the API
      const response = await fetch(
        `${BACKEND_BASE_URL}/generate-contract-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // 3. Update state with the generated contract text
      setGeneratedContractText(data.contract_text);
    } catch (error) {
      console.error("Error generating contract:", error);
      alert(
        `Failed to generate contract. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler to go back to the field editor from the draft view
  const handleGoBackToFields = () => {
    setGeneratedContractText(null);
  };

  // --- Conditional Rendering ---

  // 2. If the contract has been generated, show the Draft View
  if (generatedContractText) {
    return (
      <ContractDraftView
        contractText={generatedContractText}
        onClose={onClose}
        onGoBack={handleGoBackToFields}
      />
    );
  }

  // 1. Otherwise, show the Field Editor Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
          <h3 className="text-xl font-bold flex items-center">
            <FileSignature className="w-6 h-6 mr-2" />
            Define Contract Fields
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-indigo-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body (Input Fields) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium italic pb-2 border-b">
              Fill in the necessary details to generate a professional contract
              draft.
            </p>
            {fields.map((field) => (
              <div key={field.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  {field.isCustom ? (
                    <input
                      type="text"
                      value={field.title}
                      onChange={(e) =>
                        handleTitleChange(field.id, e.target.value)
                      }
                      placeholder="Field Title"
                      className="font-medium text-gray-900 w-full bg-transparent border-b border-indigo-300 focus:outline-none"
                    />
                  ) : (
                    <span className="font-semibold text-gray-800">
                      {field.title}
                    </span>
                  )}

                  {field.isCustom && (
                    <button
                      onClick={() => removeField(field.id)}
                      className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                      aria-label="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={field.description}
                  onChange={(e) =>
                    handleDescriptionChange(field.id, e.target.value)
                  }
                  placeholder="Enter description or value (e.g., specific terms, names, dates)"
                  className="w-full text-sm text-gray-600 mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addField}
            className="mt-4 flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <Plus className="w-5 h-5 bg-indigo-100 rounded-full p-0.5" />
            <span>Add Custom Field</span>
          </button>
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={handleGenerateContract}
            disabled={isGenerating}
            className="px-6 py-3 rounded-full font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md flex items-center space-x-2 disabled:bg-green-400"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileSignature className="w-5 h-5" />
            )}
            <span>
              {isGenerating
                ? "Drafting Contract..."
                : "Generate Full Contract Draft"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Tab Bar Component (New) ---

const ToolTabs: FC<{
  activeMode: ActiveMode;
  onSelect: (mode: ActiveMode) => void;
}> = ({ activeMode, onSelect }) => (
  <div className="flex space-x-2 border-b border-gray-200 mb-8 pt-2">
    {LEGAL_TOOL_OPTIONS.map((option) => {
      const Icon = option.icon;
      const isActive = activeMode === option.mode;

      // Handle the visual state for the modal opener
      const isAction = option.mode === "CREATE_CONTRACT";

      return (
        <button
          key={option.mode}
          onClick={() => onSelect(option.mode)}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-150 ${
            isActive && !isAction
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
              : isAction
              ? "bg-green-500 text-white rounded-md hover:bg-green-600 shadow-md flex-shrink-0"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span>{option.title}</span>
        </button>
      );
    })}
  </div>
);

// --- Main Interaction Menu (The 4 Options - Only shown initially) ---
const InitialInteractionMenu: FC<{
  onSelect: (mode: ActiveMode) => void;
}> = ({ onSelect }) => {
  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Choose Your Legal Tool
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_TOOL_OPTIONS.map((option) => (
            <button
              key={option.mode}
              onClick={() => onSelect(option.mode)}
              className={`flex items-start p-4 border rounded-lg transition-all duration-200 text-left hover:shadow-lg focus:outline-none 
              border-gray-200 hover:border-indigo-400 hover:bg-gray-50`}
            >
              <option.icon className="w-6 h-6 mr-3 mt-1 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-gray-900">
                  {option.title}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* <DottedGlowBackgroundDemoSecond /> */}
      <WorldMapDemo />
    </>
  );
};

// --- Main Dashboard Component ---

const LegalDashboard: FC = () => {
  // We use this state to ensure a tool is displayed when switching between tabs,
  // even if the user clicks the modal action button.
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // New state to track if the user has made an initial selection, triggering the tab view
  const [hasToolBeenSelected, setHasToolBeenSelected] = useState(false);
  // FIX: Added the missing state for the sidebar collapse logic
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Function to handle the selection from the main 4-option input / tabs
  const handleModeSelect = (mode: ActiveMode) => {
    setHasToolBeenSelected(true); // Switch to tab view after the very first click

    if (mode === "CREATE_CONTRACT") {
      setIsModalOpen(true);
      // Do NOT change activeMode for the content panel when opening the modal
      // This allows the previous tool (CRPC/Query/Highlight) to remain visible behind the modal.
    } else {
      setActiveMode(mode);
      setIsModalOpen(false); // Close modal if user selects a different tool
    }
  };

  // Close contract modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Determine the component to render in the main content area
  const renderModePanel = () => {
    // If a tool has been selected at least once, but the active mode is currently
    // the modal trigger, we show the default empty state.
    const modeToRender = activeMode === "CREATE_CONTRACT" ? null : activeMode;

    switch (modeToRender) {
      case "CRPC_QUERY":
        return <CRPCPanel />;
      case "QUERY_PDF":
        return <PDFContractPanel mode="query" />;
      case "HIGHLIGHT_PDF":
        return <PDFContractPanel mode="highlight" />;
      case null:
      default:
        return <DottedGlowBackground />;
    }
  };

  // --- Main Render ---
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Aside Bar (Gemini Style - Dark and Collapsible) */}
      <aside
        className={`bg-gray-900 text-white flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out z-20 flex-shrink-0 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 flex flex-col space-y-8">
          {/* Header & Collapse Button */}
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="text-xl font-extrabold text-indigo-400">
                Nyay AI
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors self-end"
              title={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
              {isSidebarCollapsed ? (
                <Menu className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronLeft className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              isActive={true}
              isCollapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={FileText}
              label="Documents"
              isActive={false}
              isCollapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={Users}
              label="Profile"
              isActive={false}
              isCollapsed={isSidebarCollapsed}
            />
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <SidebarItem
            icon={Settings}
            label="Settings"
            isActive={false}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarItem
            icon={HelpCircle}
            label="Help & Feedback"
            isActive={false}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0">
        {/* Conditional View Rendering */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 1. Initial Grid View */}
          {!hasToolBeenSelected && (
            <InitialInteractionMenu onSelect={handleModeSelect} />
          )}

          {/* 2. Persistent Tab View */}
          {hasToolBeenSelected && (
            <>
              <ToolTabs activeMode={activeMode} onSelect={handleModeSelect} />
              <div className="flex-1">{renderModePanel()}</div>
            </>
          )}
        </div>
      </main>

      {/* Contract Creation Modal */}
      {isModalOpen && <ContractModal onClose={closeModal} />}
    </div>
  );
};

export default LegalDashboard;
