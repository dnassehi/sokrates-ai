import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Clock,
  Star,
  Eye,
  MessageCircle
} from "lucide-react";

interface Session {
  id: number;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  messageCount: number;
  hasAnamnesis: boolean;
  rating: { score: number; comment: string | null; } | null;
}

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
            {getStatusIcon(session.status)}
            <span className="ml-1 capitalize">{session.status}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              Sesjon #{session.id}
            </p>
            <p className="text-sm text-gray-600">
              Startet: {formatDate(session.createdAt)}
              {session.completedAt && (
                <span> • Fullført: {formatDate(session.completedAt)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right text-sm text-gray-600">
            <p>{session.messageCount} meldinger</p>
            {session.hasAnamnesis && (
              <p className="text-green-600">✓ Anamnese klar</p>
            )}
            {session.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1">{session.rating.score}/5</span>
              </div>
            )}
          </div>

          <Link
            to="/doctor/session/$sessionId"
            params={{ sessionId: session.id.toString() }}
            className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            Se detaljer
          </Link>
        </div>
      </div>
    </div>
  );
}
