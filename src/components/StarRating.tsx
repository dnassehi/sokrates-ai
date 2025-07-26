import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ rating, onRatingChange, disabled = false }: StarRatingProps) {
  const getRatingText = (rating: number) => {
    switch (rating) {
      case 0: return "Klikk på stjernene for å gi vurdering";
      case 1: return "Dårlig";
      case 2: return "Ikke så bra";
      case 3: return "Greit";
      case 4: return "Bra";
      case 5: return "Utmerket";
      default: return "";
    }
  };

  return (
    <div className="text-center">
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Hvor fornøyd var du med samtalen?
      </label>
      <div className="flex justify-center space-x-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onRatingChange(star)}
            disabled={disabled}
            className={`p-1 transition-colors ${
              star <= rating
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-gray-400"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        {getRatingText(rating)}
      </p>
    </div>
  );
}
