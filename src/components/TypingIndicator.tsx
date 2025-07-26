export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl px-4 py-3 rounded-2xl bg-white shadow-sm border">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" style={{ animationDelay: '0.4s' }}></div>
          <p className="text-xs text-gray-400 ml-2">Sokrates tenker...</p>
        </div>
      </div>
    </div>
  );
}
