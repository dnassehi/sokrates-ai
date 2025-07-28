import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { MessageCircle, Building } from "lucide-react";
import { ChatMessage } from "~/components/ChatMessage";
import { ChatHeader } from "~/components/ChatHeader";
import { ChatInput } from "~/components/ChatInput";
import { TypingIndicator } from "~/components/TypingIndicator";

export const Route = createFileRoute("/chat/")({
  component: ChatPage,
});

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

function ChatPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [step, setStep] = useState<"clinic-code" | "chat">("clinic-code");
  const [clinicCode, setClinicCode] = useState("");
  const [clinicCodeError, setClinicCodeError] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create chat session mutation
  const createSessionMutation = useMutation(
    trpc.createChatSession.mutationOptions({
      onSuccess: (data) => {
        console.log("createChatSession success:", data);
        setSessionId(data.sessionId);
        setStep("chat");
        // Add welcome message
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "Hei! Jeg er Sokrates, din AI-assistent. Jeg vil hjelpe deg med å fylle ut en medisinsk anamnese gjennom en samtale. La oss begynne - kan du fortelle meg hva som er din hovedbekymring eller grunn til at du søker medisinsk hjelp i dag?",
          createdAt: new Date(),
        }]);
      },
      onError: (error) => {
        console.error("createChatSession error:", error);
        setClinicCodeError("Ugyldig klinikkode. Vennligst prøv igjen.");
      },
    })
  );

  // Complete session mutation
  const completeSessionMutation = useMutation(
    trpc.completeChatSession.mutationOptions({
      onSuccess: () => {
        navigate({ to: "/thank-you", search: { sessionId: sessionId! } });
      },
    })
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    trpc.sendChatMessage.mutationOptions({
      onSuccess: (data) => {
        console.log("Message sent successfully:", data);
        // Add assistant response to chat
        // Ensure data is not void and has content property
        if (typeof data === "object" && data !== null && "content" in data && (data as any).content !== undefined) {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: (data as any).content,
            createdAt: new Date(),
          }]);
        }
        setIsStreaming(false);
      },
      onError: (error) => {
        console.error("Error sending message:", error);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Beklager, det oppstod en feil. Vennligst prøv igjen.",
          createdAt: new Date(),
        }]);
        setIsStreaming(false);
      },
    })
  );

  const handleClinicCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicCode.trim()) {
      setClinicCodeError("Klinikkode er påkrevd");
      return;
    }
    setClinicCodeError("");
    createSessionMutation.mutate({ clinicCode: clinicCode.trim() });
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    setIsStreaming(true);

    try {
      // Call the actual sendChatMessage procedure
      console.log("Calling sendChatMessage with:", { sessionId, message: messageToSend });

      sendMessageMutation.mutate({
        sessionId,
        message: messageToSend,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Beklager, det oppstod en feil. Vennligst prøv igjen.",
        createdAt: new Date(),
      }]);
      setIsStreaming(false);
    }
  };

  const handleCompleteSession = () => {
    if (sessionId) {
      completeSessionMutation.mutate({ sessionId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const disclaimerText =
    "Sokrates AI gir ikke medisinsk rådgivning. Kontakt alltid kvalifisert helsepersonell for medisinske spørsmål.";

  if (step === "clinic-code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Start samtale med Sokrates
              </h1>
              <p className="text-gray-600">
                Oppgi klinikkoden du har fått for å begynne samtalen
              </p>
            </div>

            {/* Clinic Code Form */}
            <form onSubmit={handleClinicCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="clinicCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Klinikkode
                </label>
                <div className="relative">
                  <Building className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="clinicCode"
                    type="text"
                    value={clinicCode}
                    onChange={(e) => setClinicCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="KLINIKK_001"
                    disabled={createSessionMutation.isPending}
                  />
                </div>
                {clinicCodeError && (
                  <p className="mt-1 text-sm text-red-600">{clinicCodeError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Klinikkoden har du fått fra din lege eller klinikk
                </p>
              </div>

              <button
                type="submit"
                disabled={createSessionMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {createSessionMutation.isPending ? "Starter samtale..." : "Start samtale"}
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Tilbake til forsiden
              </Link>
            </div>
            <p className="mt-6 text-xs text-gray-500 text-center">{disclaimerText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (createSessionMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Starter samtale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatHeader
        onCompleteSession={handleCompleteSession}
        isCompletingSession={completeSessionMutation.isPending}
        canCompleteSession={messages.length >= 4}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Streaming indicator */}
          {isStreaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        currentMessage={currentMessage}
        onMessageChange={setCurrentMessage}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        isDisabled={isStreaming}
      />
      <p className="text-xs text-gray-500 text-center px-4 py-2">{disclaimerText}</p>
    </div>
  );
}
