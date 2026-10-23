import { stateName, type FamilyProfile, type StudyPartnerAvailability } from './triage';
export interface ProfileRow {
  id: string;
  location: string | null;
  relationship: string | null;
  diagnosis_stage: string | null;
  age_band: string | null;
  study_partner: string | null;
  willing_to_travel: string | null;
}

const AGE_BAND_RANGES: Record<string, { minAge: number; maxAge: number }> = {
  "under-50": { minAge: 0, maxAge: 49 },
  "50-64": { minAge: 50, maxAge: 64 },
  "65-74": { minAge: 65, maxAge: 74 },
  "75-84": { minAge: 75, maxAge: 84 },
  "85-plus": { minAge: 85, maxAge: 150 },
};

// Recognize a full state name at the end, or the final state abbreviation.
// ZIP codes and driving distances are not inferred.
const US_STATE_CODES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
]);

export function extractState(location: string | null): string | null {
  if (!location) return null;
  const text = location.trim().toLowerCase();
  for (const code of US_STATE_CODES) {
    const name = stateName(code);
    if (
      text === name ||
      text.endsWith(", " + name) ||
      text.endsWith(" " + name)
    )
      return code;
  }
  const tokens = location.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
  return tokens.reverse().find((token) => US_STATE_CODES.has(token)) || null;
}

function mapStudyPartner(value: string | null): StudyPartnerAvailability {
  if (value === "yes") return "yes";
  if (value === "no") return "no";
  return "unknown"; // covers 'not-sure' and blank/null
}

function mapWillingToTravel(value: string | null): boolean {
  if (value === "local-only") return false;
  if (value === "short-drive" || value === "long-distance") return true;
  // Not answered: default to true so we don't silently drop trials over
  // a skipped question. Flip this if you'd rather default conservatively.
  return true;
}

export function toFamilyProfile(row: ProfileRow): FamilyProfile {
  return {
    location: {
      country: "United States", // assumed — see chat notes
      state: extractState(row.location),
    },
    relationship: row.relationship ?? "",
    diagnosisStage: row.diagnosis_stage ?? "",
    ageBand: row.age_band ? (AGE_BAND_RANGES[row.age_band] ?? null) : null,
    studyPartner: mapStudyPartner(row.study_partner),
    willingToTravel: mapWillingToTravel(row.willing_to_travel),
  };
}

