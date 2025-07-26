import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { Stethoscope, Mail, Lock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/doctor/login/")({
  component: DoctorLoginPage,
});

interface LoginFormData {
  email: string;
  password: string;
}

function DoctorLoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const loginMutation = useMutation(
    trpc.doctorLogin.mutationOptions({
      onSuccess: (data) => {
        login(data.token, data.doctor);
        navigate({ to: "/doctor/dashboard" });
      },
    })
  );

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lege-innlogging
            </h1>
            <p className="text-gray-600">
              Logg inn for å få tilgang til ditt dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  {...register("email", { 
                    required: "E-post er påkrevd",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Ugyldig e-postadresse"
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="din@epost.no"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passord
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  {...register("password", { 
                    required: "Passord er påkrevd",
                    minLength: {
                      value: 6,
                      message: "Passord må være minst 6 tegn"
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loginMutation.isPending ? "Logger inn..." : "Logg inn"}
            </button>

            {loginMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  Ugyldig e-post eller passord. Prøv igjen.
                </p>
              </div>
            )}
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Har du ikke en konto?</p>
            <Link
              to="/doctor/register"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Registrer deg som lege
            </Link>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
