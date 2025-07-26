import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { 
  MessageCircle, 
  Filter,
  LogOut,
  Stethoscope
} from "lucide-react";
import { SessionCard } from "~/components/SessionCard";
import { DashboardStats } from "~/components/DashboardStats";

export const Route = createFileRoute("/doctor/dashboard/")({
  component: DoctorDashboard,
});

function DoctorDashboard() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, doctor, logout, isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate({ to: "/doctor/login" });
    }
  }, [isAuthenticated, token, navigate]);

  const sessionsQuery = useQuery(
    trpc.getDoctorSessions.queryOptions(
      {
        authToken: token!,
        status: statusFilter,
        limit: 20,
      },
      {
        enabled: !!token,
        refetchInterval: 30000, // Refetch every 30 seconds
      }
    )
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (!isAuthenticated || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Stethoscope className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sokrates Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Velkommen, {doctor.email} • Klinikk: {doctor.clinicCode}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logg ut
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <DashboardStats sessions={sessionsQuery.data?.items || []} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              {[
                { value: "all", label: "Alle" },
                { value: "active", label: "Aktive" },
                { value: "completed", label: "Fullførte" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pasientsesjoner</h2>
          </div>
          
          {sessionsQuery.isLoading ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Laster sesjoner...</p>
            </div>
          ) : sessionsQuery.data?.items.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Ingen sesjoner funnet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessionsQuery.data?.items.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
