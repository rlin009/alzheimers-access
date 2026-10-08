// The five conditions Free the Burp covers, in the order they sit along the
// swallowing tract, from the throat down to the stomach. Everything that is
// a fact here is repeated, with its source, on the condition's own page.

export type Slug = "zenkers" | "r-cpd" | "a-cpd" | "spasm" | "achalasia";

/** The label used in content/vocabulary.csv and the data files. */
export type Label = "Zenker's" | "R-CPD" | "A-CPD" | "Spasm" | "Achalasia";

export type Condition = {
  slug: Slug;
  label: Label;
  /** Large display name. */
  name: string;
  fullName: string;
  alsoCalled: string[];
  /** Where along the tube, in plain words. */
  place: string;
  /** What goes wrong, in one short line. */
  fails: string;
  /** Who it usually affects. */
  who: string;
  /** The test to ask for by name. */
  test: string;
  /** Who to ask. */
  specialist: string;
  /** Conditions most often confused with this one. */
  neighbours: Slug[];
};

export const CONDITIONS: Condition[] = [
  {
    slug: "zenkers",
    label: "Zenker's",
    name: "Zenker's",
    fullName: "Zenker's diverticulum",
    alsoCalled: ["pharyngeal pouch", "hypopharyngeal diverticulum"],
    place: "A pouch just above the upper sphincter",
    fails: "A tight upper sphincter pushes out a pocket that catches food",
    who: "Mostly people in their 70s and 80s",
    test: "Barium swallow on video X-ray (videofluoroscopy)",
    specialist: "Ear, nose and throat doctor or gastroenterologist",
    neighbours: ["a-cpd", "achalasia", "r-cpd"],
  },
  {
    slug: "r-cpd",
    label: "R-CPD",
    name: "R-CPD",
    fullName: "Retrograde cricopharyngeus dysfunction",
    alsoCalled: ["inability to burp", "abelchia", "no-burp syndrome"],
    place: "The upper sphincter, at the bottom of the throat",
    fails: "Will not open to let air come back up",
    who: "Usually starts in childhood",
    test: "Diagnosed from symptoms by a laryngologist; sometimes manometry with a fizzy drink",
    specialist: "Ear, nose and throat doctor (laryngologist)",
    neighbours: ["a-cpd", "achalasia", "zenkers"],
  },
  {
    slug: "a-cpd",
    label: "A-CPD",
    name: "A-CPD",
    fullName: "Antegrade cricopharyngeal dysfunction",
    alsoCalled: ["cricopharyngeal dysfunction", "cricopharyngeal achalasia", "cricopharyngeal bar"],
    place: "The upper sphincter, at the bottom of the throat",
    fails: "Will not open fully to let food go down",
    who: "Mostly older adults",
    test: "Videofluoroscopic swallow study (modified barium swallow)",
    specialist: "Laryngologist and a speech-language pathologist",
    neighbours: ["r-cpd", "zenkers", "achalasia"],
  },
  {
    slug: "spasm",
    label: "Spasm",
    name: "Spasm",
    fullName: "Distal esophageal spasm and jackhammer esophagus",
    alsoCalled: ["DES", "hypercontractile esophagus"],
    place: "The body of the esophagus, between the two sphincters",
    fails: "Squeezes too early, or far too hard",
    who: "Mostly older adults",
    test: "High-resolution manometry, after the heart has been checked",
    specialist: "Gastroenterologist",
    neighbours: ["achalasia", "r-cpd"],
  },
  {
    slug: "achalasia",
    label: "Achalasia",
    name: "Achalasia",
    fullName: "Achalasia",
    alsoCalled: ["esophageal achalasia", "achalasia cardia"],
    place: "The lower sphincter, where the esophagus meets the stomach",
    fails: "Will not open to let food into the stomach, and the pushing wave stops",
    who: "Most often starts between 30 and 60",
    test: "High-resolution manometry, plus an endoscopy",
    specialist: "Gastroenterologist",
    neighbours: ["spasm", "zenkers", "a-cpd"],
  },
];

export const BY_SLUG = Object.fromEntries(CONDITIONS.map((c) => [c.slug, c])) as Record<Slug, Condition>;
export const BY_LABEL = Object.fromEntries(CONDITIONS.map((c) => [c.label, c])) as Record<Label, Condition>;

export function isSlug(value: string): value is Slug {
  return value in BY_SLUG;
}

/** Sections every condition page has, in this order. */
export const SECTION_TITLES = [
  "What it is",
  "What it feels like",
  "What tells it apart from the ones next to it",
  "How it gets confirmed",
  "How it gets treated",
  "What the evidence says",
] as const;
