import type { ChatMessage } from "~/routes/chat/index";

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
            : "bg-white shadow-sm border"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-2 ${
          message.role === "user" ? "text-blue-100" : "text-gray-400"
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
