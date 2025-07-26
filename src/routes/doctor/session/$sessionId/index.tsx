import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { 
  ArrowLeft, 
  MessageCircle, 
  User, 
  Bot, 
  Calendar, 
  Star,
  FileText,
  Clock,
  CheckCircle
} from "lucide-react";

export const Route = createFileRoute("/doctor/session/$sessionId/")({
  component: SessionDetailsPage,
});

function SessionDetailsPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate({ to: "/doctor/login" });
    }
  }, [isAuthenticated, token, navigate]);

  const sessionQuery = useQuery(
    trpc.getSessionDetails.queryOptions(
      {
        authToken: token!,
        sessionId: parseInt(sessionId),
      },
      {
        enabled: !!token && !!sessionId,
      }
    )
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laster sesjondetaljer...</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Kunne ikke laste sesjon
          </h1>
          <p className="text-gray-600 mb-4">
            Sesjonen ble ikke funnet eller du har ikke tilgang til den.
          </p>
          <Link
            to="/doctor/dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til dashboard
          </Link>
        </div>
      </div>
    );
  }

  const session = sessionQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/doctor/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sesjon #{session.id}
                </h1>
                <p className="text-sm text-gray-600">
                  Startet: {formatDate(session.createdAt)}
                  {session.completedAt && (
                    <span> • Fullført: {formatDate(session.completedAt)}</span>
                  )}
                </p>
              </div>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              session.status === "completed" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {session.status === "completed" ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <Clock className="w-4 h-4 mr-1" />
              )}
              {session.status === "completed" ? "Fullført" : "Aktiv"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Messages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Samtale ({session.messages.length} meldinger)
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {session.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-2xl ${message.role === "user" ? "order-2" : ""}`}>
                        <div className="flex items-center mb-1">
                          {message.role === "user" ? (
                            <User className="w-4 h-4 text-blue-500 mr-2" />
                          ) : (
                            <Bot className="w-4 h-4 text-green-500 mr-2" />
                          )}
                          <span className="text-xs text-gray-500">
                            {message.role === "user" ? "Pasient" : "Sokrates AI"} • {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-blue-500 text-white ml-6"
                            : "bg-gray-100 text-gray-900 mr-6"
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with Anamnesis and Rating */}
          <div className="space-y-6">
            {/* Anamnesis */}
            {session.anamnesis && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Strukturert anamnese
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Hovedplage</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.hovedplage}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Tidligere sykdommer</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.tidligereSykdommer}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Medisinering</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.medisinering}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Allergier</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.allergier}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Familiehistorie</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.familiehistorie}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Sosial livsstil</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.sosialLivsstil}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">ROS (Review of Systems)</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.ros}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Pasientmål</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.pasientMaal}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Fri oppsummering</h4>
                    <p className="text-sm text-gray-600">{session.anamnesis.friOppsummering}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Rating */}
            {session.rating && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Pasientvurdering
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= session.rating!.score
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {session.rating.score}/5
                    </span>
                  </div>
                  {session.rating.comment && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Kommentar</h4>
                      <p className="text-sm text-gray-600">{session.rating.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Sesjoninfo
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">Status:</span>
                  <span className={`ml-2 text-sm ${
                    session.status === "completed" ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {session.status === "completed" ? "Fullført" : "Aktiv"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Startet:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {formatDate(session.createdAt)}
                  </span>
                </div>
                {session.completedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Fullført:</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {formatDate(session.completedAt)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-900">Antall meldinger:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {session.messages.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
