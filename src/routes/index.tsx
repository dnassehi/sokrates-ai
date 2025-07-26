import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Stethoscope, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sokrates AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            En intelligent samtaleassistent som hjelper pasienter med å fylle ut medisinsk anamnese 
            gjennom sokratisk dialog, og gir leger et strukturert grunnlag for videre behandling.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Patient Card */}
          <Link 
            to="/chat" 
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Start samtale
              </h2>
              <p className="text-gray-600 mb-6">
                Begynn en anonym samtale med Sokrates AI-assistenten for å fylle ut din medisinske anamnese.
              </p>
              <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                Start chat
                <MessageCircle className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link 
            to="/doctor/login" 
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-indigo-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-200 transition-colors">
                <Stethoscope className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Lege-innlogging
              </h2>
              <p className="text-gray-600 mb-6">
                Logg inn for å se pasientsesjoner, anamnese og gi vurderinger i ditt dashboard.
              </p>
              <div className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                Logg inn
                <Stethoscope className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold text-center text-gray-900 mb-12">
            Hvordan fungerer Sokrates?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Sokratisk dialog</h4>
              <p className="text-gray-600">
                AI-assistenten stiller gjennomtenkte spørsmål for å samle medisinsk informasjon på en naturlig måte.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Strukturert data</h4>
              <p className="text-gray-600">
                Samtalen konverteres automatisk til et strukturert anamnese-skjema som leger kan vurdere.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Sikker og anonym</h4>
              <p className="text-gray-600">
                Pasienter kan chatte anonymt, og all data håndteres sikkert i henhold til personvernregler.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
