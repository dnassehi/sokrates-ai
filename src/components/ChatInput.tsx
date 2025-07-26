import { Send } from "lucide-react";

interface ChatInputProps {
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isDisabled: boolean;
}

export function ChatInput({
  currentMessage,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  isDisabled
}: ChatInputProps) {
  return (
    <div className="bg-white border-t px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex space-x-4">
          <textarea
            value={currentMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Skriv ditt svar her..."
            disabled={isDisabled}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            rows={3}
          />
          <button
            onClick={onSendMessage}
            disabled={!currentMessage.trim() || isDisabled}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Trykk Enter for å sende, Shift+Enter for ny linje
        </p>
      </div>
    </div>
  );
}
