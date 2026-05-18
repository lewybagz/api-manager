export function getPasswordStrength(password: string): {
  barClass: string;
  label: string;
  labelClass: string;
  score: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  let label = "Very weak";
  let barClass = "bg-red-500/90";
  let labelClass = "text-red-300";

  if (score >= 5) {
    label = "Strong";
    barClass = "bg-zk-safe";
    labelClass = "text-zk-safe";
  } else if (score >= 4) {
    label = "Good";
    barClass = "bg-amber-400/90";
    labelClass = "text-amber-200/90";
  } else if (score >= 3) {
    label = "Fair";
    barClass = "bg-amber-500/80";
    labelClass = "text-amber-200/80";
  } else if (score >= 2) {
    label = "Weak";
    barClass = "bg-orange-500/85";
    labelClass = "text-orange-200/90";
  }

  return { barClass, label, labelClass, score };
}
