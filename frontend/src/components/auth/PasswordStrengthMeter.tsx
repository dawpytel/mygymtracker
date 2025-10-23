/**
 * PasswordStrengthMeter Component
 * Visual indicator of password strength
 */

interface PasswordStrengthMeterProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong";

interface StrengthConfig {
  level: StrengthLevel;
  label: string;
  color: string;
  widthClass: string;
}

/**
 * Calculate password strength based on length and character variety
 */
function calculatePasswordStrength(password: string): StrengthConfig {
  if (!password) {
    return {
      level: "weak",
      label: "",
      color: "bg-gray-300",
      widthClass: "w-0",
    };
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars

  // Determine strength level
  if (score <= 2) {
    return {
      level: "weak",
      label: "Weak",
      color: "bg-red-500",
      widthClass: "w-1/3",
    };
  }

  if (score <= 4) {
    return {
      level: "medium",
      label: "Medium",
      color: "bg-yellow-500",
      widthClass: "w-2/3",
    };
  }

  return {
    level: "strong",
    label: "Strong",
    color: "bg-green-500",
    widthClass: "w-full",
  };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color} ${strength.widthClass}`}
          role="progressbar"
          aria-valuenow={strength.level === "weak" ? 33 : strength.level === "medium" ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Password strength"
        />
      </div>
      {strength.label && (
        <p className="text-xs text-gray-600 mt-1">
          Password strength: <span className="font-medium">{strength.label}</span>
        </p>
      )}
    </div>
  );
}

