import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { CheckCircle, Home, MessageCircle } from "lucide-react";
import { z } from "zod";
import { StarRating } from "~/components/StarRating";

const thankYouSearchSchema = z.object({
  sessionId: z.number(),
});

export const Route = createFileRoute("/thank-you/")({
  validateSearch: thankYouSearchSchema,
  component: ThankYouPage,
});

interface RatingFormData {
  score: number;
  comment: string;
}

function ThankYouPage() {
  const { sessionId } = Route.useSearch();
  const trpc = useTRPC();
  const [submitted, setSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RatingFormData>();

  const submitRatingMutation = useMutation(
    trpc.submitRating.mutationOptions({
      onSuccess: () => {
        setSubmitted(true);
      },
    })
  );

  const onSubmit = (data: RatingFormData) => {
    submitRatingMutation.mutate({
      sessionId,
      score: selectedRating,
      comment: data.comment || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Takk for tilbakemeldingen!
          </h1>
          <p className="text-gray-600 mb-8">
            Din vurdering er sendt. Legen vil kunne se både samtalen og din tilbakemelding.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Samtale fullført!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Takk for at du brukte Sokrates AI. Din medisinske anamnese er nå strukturert og klar for vurdering av lege.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Hva skjer nå?</h3>
              <div className="text-left space-y-2 text-blue-800">
                <div className="flex items-start">
                  <MessageCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Din samtale er lagret og strukturert i et anamnese-skjema</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Legen kan nå se både hele samtalen og det strukturerte skjemaet</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dette gir legen et godt grunnlag for videre behandling</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Vurder din opplevelse
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Star Rating */}
              <StarRating
                rating={selectedRating}
                onRatingChange={(rating) => {
                  setSelectedRating(rating);
                  setValue("score", rating);
                }}
                disabled={submitRatingMutation.isPending}
              />

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Kommentar (valgfritt)
                </label>
                <textarea
                  id="comment"
                  {...register("comment")}
                  placeholder="Del gjerne dine tanker om samtalen..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={selectedRating === 0 || submitRatingMutation.isPending}
                  className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitRatingMutation.isPending ? "Sender..." : "Send vurdering"}
                </button>
                
                <Link
                  to="/"
                  className="flex-1 text-center bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Hopp over
                </Link>
              </div>
            </form>

            {submitRatingMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  Det oppstod en feil ved sending av vurdering. Prøv igjen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
