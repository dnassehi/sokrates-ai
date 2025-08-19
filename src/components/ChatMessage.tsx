import type { ChatMessage } from "~/routes/chat/index";
import Markdown from "markdown-to-jsx";

// Debug function to check if markdown is being processed
const debugMarkdown = (content: string) => {
  console.log("Markdown content:", content);
  console.log("Contains **:", content.includes("**"));
  console.log("Content type:", typeof content);
  return content;
};

// Simple markdown parser for testing
const simpleMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/- (.*)/g, '<li>$1</li>');
};

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-2xl px-4 py-3 rounded-2xl ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : "bg-white shadow-sm border text-gray-900"
        }`}
      >
                                <div className="prose prose-sm max-w-none text-sm">
          <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(debugMarkdown(message.content)) }} />
        </div>
        <p className={`text-xs mt-2 ${
          message.role === "user" ? "text-blue-100" : "text-gray-600"
        }`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
