export type FormState = {
  location: string;
  relationship: string;
  diagnosisStage: string;
  ageBand: string;
  studyPartner: string;
  willingToTravel: string;
};
export const emptyForm: FormState = {
  location: "",
  relationship: "",
  diagnosisStage: "",
  ageBand: "",
  studyPartner: "",
  willingToTravel: "",
};
export const fields = [
  {
    key: "location",
    label: "Approximate location",
    why: "to find things close enough to be realistic. A city and state are enough — never your street address.",
  },
  {
    key: "relationship",
    label: "Relationship to the person diagnosed",
    why: "some resources are aimed at spouses, some at adult children, and some at the person themselves. This answer does not currently change the trial sort.",
    options: [
      ["", "Prefer not to say"],
      ["adult-child", "Adult child"],
      ["spouse", "Spouse or partner"],
      ["myself", "I am the person diagnosed"],
      ["other-family", "Other family member"],
      ["friend", "Friend"],
      ["caregiver", "Caregiver"],
    ],
  },
  {
    key: "diagnosisStage",
    label: "Diagnosis stage, if known",
    why: "some resources only apply at certain stages. This answer does not currently change the trial sort. Leave it blank if you’re unsure.",
    options: [
      ["", "Not sure / prefer not to say"],
      ["mild-cognitive-impairment", "Mild cognitive impairment"],
      ["early", "Early / mild"],
      ["moderate", "Moderate"],
      ["advanced", "Advanced / severe"],
    ],
  },
  {
    key: "ageBand",
    label: "Broad age band",
    why: "age range affects which studies and resources are relevant. A rough range is all we need.",
    options: [
      ["", "Prefer not to say"],
      ["under-50", "Under 50"],
      ["50-64", "50–64"],
      ["65-74", "65–74"],
      ["75-84", "75–84"],
      ["85-plus", "85 and older"],
    ],
  },
  {
    key: "studyPartner",
    label: "Is a study partner available?",
    why: "many clinical studies require a family member or caregiver to participate alongside the person diagnosed.",
    options: [
      ["", "Not sure / prefer not to say"],
      ["yes", "Yes"],
      ["no", "No"],
      ["not-sure", "Not sure"],
    ],
  },
  {
    key: "willingToTravel",
    label: "Willingness to travel",
    why: "some studies and resources are only available at specific sites. This helps us gauge distance you’d consider.",
    options: [
      ["", "Not sure / prefer not to say"],
      ["local-only", "Close to home only"],
      ["short-drive", "A short drive"],
      ["long-distance", "Longer distances are possible"],
    ],
  },
] as const;
export function displayAnswer(key: keyof FormState, value: string) {
  const field = fields.find((f) => f.key === key);
  return (
    (field && "options" in field
      ? field.options.find((o) => o[0] === value)?.[1]
      : undefined) ||
    value ||
    "Not shared"
  );
}
export function validProfileId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}
export function rowToForm(row: Record<string, unknown>): FormState {
  const text = (key: string) =>
    typeof row[key] === "string" ? (row[key] as string) : "";
  return {
    location: text("location"),
    relationship: text("relationship"),
    diagnosisStage: text("diagnosis_stage"),
    ageBand: text("age_band"),
    studyPartner: text("study_partner"),
    willingToTravel: text("willing_to_travel"),
  };
}
export function validateForm(body: unknown): FormState | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  const result = { ...emptyForm };
  for (const key of Object.keys(emptyForm) as (keyof FormState)[]) {
    const value = input[key];
    if (value != null && typeof value !== "string") return null;
    const text = typeof value === "string" ? value.trim() : "";
    if (text.length > 200) return null;
    result[key] = text;
  }
  for (const key of ["ageBand", "studyPartner", "willingToTravel"] as const) {
    const field = fields.find((f) => f.key === key)!;
    if (
      "options" in field &&
      !field.options.some((option) => option[0] === result[key])
    )
      return null;
  }
  return result;
}
