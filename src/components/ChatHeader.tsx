import { MessageCircle, CheckCircle } from "lucide-react";

interface ChatHeaderProps {
  onCompleteSession: () => void;
  isCompletingSession: boolean;
  canCompleteSession: boolean;
}

export function ChatHeader({ 
  onCompleteSession, 
  isCompletingSession, 
  canCompleteSession 
}: ChatHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sokrates AI</h1>
            <p className="text-sm text-gray-500">Medisinsk anamnese-assistent</p>
          </div>
        </div>
        <button
          onClick={onCompleteSession}
          disabled={isCompletingSession || !canCompleteSession}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Fullfør samtale
        </button>
      </div>
    </div>
  );
}
