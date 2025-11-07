"use client";
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, FileText, Search, Loader2 } from "lucide-react";

// --- TypeScript Definitions ---
type Role = "user" | "assistant";

interface Source {
  file: string;
  preview: string;
  title: string;
  type: string;
}

interface Message {
  role: Role;
  content: string;
  sources?: Source[];
}

interface ApiResponse {
  answer: string;
  query: string;
  sources: Source[];
}

// --- Mock API Response Data ---
const MOCK_API_RESPONSE: ApiResponse = {
  answer:
    "content=\"Section 125 of the Code of Criminal Procedure (CrPC) in India deals with the maintenance of a wife, children, and parents. Here's a breakdown of the key aspects:\\n\\n**Maintenance under Section 125 CrPC:**\\n\\n1. **Wife's right to maintenance:** A wife is entitled to receive maintenance from her husband if she is unable to maintain herself.\\n2. **Conditions for maintenance:** The wife must be unable to maintain herself out of her own earnings or property, and the husband must have sufficient means to provide maintenance.\\n3. **Amount of maintenance:** The amount of maintenance is determined by the court, taking into account the husband's income, expenses, and other factors.\\n4. **Interim maintenance:** The court can also grant interim maintenance to the wife during the pendency of the proceedings.\\n\\n**Dependent spouse's rights:**\\n\\n1. **Right to maintenance:** A dependent spouse, including a wife, is entitled to receive maintenance from the other spouse if they are unable to maintain themselves.\\n2. **Conditions for maintenance:** The dependent spouse must be unable to maintain themselves out of their own earnings or property, and the other spouse must have sufficient means to provide maintenance.\\n\\n**Children's rights:**\\n\\n1. **Right to maintenance:** Children are entitled to receive maintenance from their parents, including a father who has sufficient means to provide maintenance.\\n2. **Conditions for maintenance:** The children must be unable to maintain themselves out of their own earnings or property, and the parents must have sufficient means to provide maintenance.\\n\\n**Parents' rights:**\\n\\n1. **Right to maintenance:** Parents are entitled to receive maintenance from their children, including a son who has sufficient means to provide maintenance.\\n2. **Conditions for maintenance:** The parents must be unable to maintain themselves out of their own earnings or property, and the children must have sufficient means to provide maintenance.\\n\\n**Alimony:**\\n\\n1. **Permanent alimony:** The court can grant permanent alimony to a wife or husband, taking into account the financial circumstances of both parties.\\n2. **Interim alimony:** The court can also grant interim alimony during the pendency of the proceedings.\\n\\nIn the context of the provided text, the court has granted a decree of divorce to the appellant/husband, but has also ordered him to pay a significant amount of permanent alimony (Rs. 30,00,000) to the respondent/wife, considering his financial circumstances and the fact that the wife is dependent on him.\" response_metadata={'token_usage': {'completion_tokens': 504, 'prompt_tokens': 1426, 'total_tokens': 1930, 'completion_time': 1.264808269, 'prompt_time': 0.072790933, 'queue_time': 0.052598128, 'total_time': 1.337599202}, 'model_name': 'llama-3.3-70b-versatile', 'system_fingerprint': 'fp_fb4860a75b', 'finish_reason': 'stop', 'logprobs': None} id='run-3be1f216-8c2d-4dd1-a28f-e833a7452c2e-0\"",
  query: "Explain Section 125 CrPC regarding maintenance of wife.",
  sources: [
    {
      file: "2023_16_1209_1524_EN.pdf",
      preview: "...",
      title: "N/A",
      type: "unknown",
    },
    {
      file: "the_code_of_criminal_procedure,_1973.pdf",
      preview: "...",
      title: "Section 127",
      type: "statute",
    },
    {
      file: "2023_14_247_265_EN.pdf",
      preview: "...",
      title: "N/A",
      type: "unknown",
    },
  ],
};

// Custom parser to clean the response text from the LLM's complex string format.
const parseRawAnswer = (rawAnswer: string): string => {
  if (!rawAnswer || typeof rawAnswer !== "string") return "";

  // 1. Remove the starting `content="`
  let cleanedText = rawAnswer.replace(/^content="/, "");

  // 2. Find the start of the metadata to truncate the string
  const metadataIndex = cleanedText.indexOf('" response_metadata=');

  if (metadataIndex !== -1) {
    // 3. Truncate and remove the closing quote before the metadata
    cleanedText = cleanedText.substring(0, metadataIndex);
  } else {
    // Fallback: If metadata not found, remove a possible trailing quote
    cleanedText = cleanedText.replace(/"$/, "");
  }

  // 4. Replace double newlines (\n\n) with paragraph breaks and single \n with line breaks
  const formattedHtml = cleanedText
    .split("\\n\\n") // Separate paragraphs
    .map(
      (para) =>
        para
          .replace(/\\n/g, "<br/>") // Replace single line breaks with <br/>
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Replace **text** with <strong>text</strong>
    )
    .join('<p class="mb-3">') // Join paragraphs with spacing
    .replace(/^/, '<p class="mb-3">'); // Add starting paragraph tag if needed

  return formattedHtml;
};

// Component to render a single message
const Message: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  const { content, sources } = message;

  // Use a simple container for formatting based on role
  const baseClasses = isUser
    ? "bg-blue-600 text-white rounded-tr-lg rounded-bl-lg rounded-tl-lg"
    : "bg-gray-100 text-gray-800 rounded-tl-lg rounded-br-lg rounded-tr-lg";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-4xl p-4 shadow-lg flex flex-col ${baseClasses} transition-all duration-300`}
      >
        {/* Message Content */}
        <div className="flex items-start mb-2">
          {isUser ? (
            <User className="w-5 h-5 mr-3 text-white shrink-0" />
          ) : (
            <Bot className="w-5 h-5 mr-3 text-gray-600 shrink-0" />
          )}
          <div
            className={`text-sm ${isUser ? "text-white" : "text-gray-800"}`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Sources/Citations (only for assistant) */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-300/50">
            <h4 className="flex items-center text-xs font-semibold uppercase text-gray-600 mb-2">
              <Search className="w-3 h-3 mr-1" /> Sources Used
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sources.slice(0, 3).map((source, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 bg-gray-200 rounded-lg text-xs hover:bg-gray-300 transition-colors"
                >
                  <FileText className="w-3 h-3 mr-1 text-gray-500" />
                  <span className="truncate font-medium text-gray-700">
                    {source.title && source.title !== "N/A"
                      ? source.title
                      : source.file}
                  </span>
                </div>
              ))}
              {sources.length > 3 && (
                <div className="p-2 text-xs text-gray-600">
                  and {sources.length - 3} more sources.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Chat Dashboard Component
const ChatDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Simulate the API call (replace this with your actual fetch logic)
  const simulateApiCall = async (query: string): Promise<ApiResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Use the mock response, but update the query to reflect user's input
    return {
      ...MOCK_API_RESPONSE,
      query: query,
    };
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };

    // Add user message to history
    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Step 1: Simulate the API call
      const rawResponse = await simulateApiCall(userQuery);

      // Step 2: Extract and format the actual text content
      const cleanedContent = parseRawAnswer(rawResponse.answer);

      const assistantMessage: Message = {
        role: "assistant",
        content: cleanedContent,
        sources: rawResponse.sources,
      };

      // Add assistant response to history
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "<strong>Error:</strong> Failed to fetch response. Check console for details.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-blue-600" />
          Nyay Sahayak - Legal Co-Pilot
        </h1>
        <div className="text-sm text-gray-500 hidden sm:block">
          Ask any question about Indian law.
        </div>
      </header>

      {/* Chat History Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pt-16">
            <Search className="w-10 h-10 mb-4 text-gray-300" />
            <p className="text-lg font-semibold">Start your legal research.</p>
            <p className="text-sm">
              Ask me about any section of Indian law or case summaries.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => <Message key={index} message={msg} />)
        )}
        <div ref={messagesEndRef} />

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-tl-lg rounded-br-lg rounded-tr-lg max-w-sm p-4 shadow-lg flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
              <span className="text-sm">Generating answer...</span>
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={handleSend}
          className="flex items-center w-full max-w-5xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your legal query here..."
            disabled={loading}
            className="flex-1 p-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-inner disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-r-xl hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatDashboard;
