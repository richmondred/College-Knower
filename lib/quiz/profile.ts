export type PlayerProfile = {
  id: string;
  displayName: string;
  city: string | null;
  countryCode: string;
  showCity: boolean;
  createdAt: string;
  updatedAt: string;
};

const BLOCKED_TERMS = ["admin", "moderator", "official", "support"];

export function sanitisePublicText(value: string, maxLength: number): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateDisplayName(value: string): string | null {
  const cleaned = sanitisePublicText(value, 32);
  if (cleaned.length < 2) return "Display name must be at least 2 characters.";
  if (BLOCKED_TERMS.some((term) => cleaned.toLowerCase().includes(term))) {
    return "Choose a display name that does not impersonate the platform or staff.";
  }
  return null;
}

export function validateCity(value: string): string | null {
  const cleaned = sanitisePublicText(value, 40);
  if (!cleaned) return null;
  if (/\d{4,}/.test(cleaned)) return "City should not include a postcode or address.";
  return null;
}
