import { Users, Clock, CheckCircle } from "lucide-react";

interface Session {
  status: "active" | "completed";
}

interface DashboardStatsProps {
  sessions: Session[];
}

export function DashboardStats({ sessions }: DashboardStatsProps) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === "active").length;
  const completedSessions = sessions.filter(s => s.status === "completed").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Totale sesjoner</p>
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Aktive</p>
            <p className="text-2xl font-bold text-gray-900">{activeSessions}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Fullførte</p>
            <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
