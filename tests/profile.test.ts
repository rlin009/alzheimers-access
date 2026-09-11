import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyForm,
  validateForm,
  validProfileId,
  rowToForm,
} from "../src/lib/profile";
test("all six questions may be skipped", () =>
  assert.deepEqual(validateForm({}), emptyForm));
test("unexpected shapes and oversized free text are rejected", () => {
  assert.equal(validateForm({ location: { private: "value" } }), null);
  assert.equal(validateForm({ location: "x".repeat(201) }), null);
  assert.equal(validateForm([]), null);
});
test("structured sorting answers must be recognized values", () => {
  assert.equal(validateForm({ studyPartner: "maybe" }), null);
  assert.equal(
    validateForm({
      ageBand: "65-74",
      willingToTravel: "local-only",
      studyPartner: "no",
    })?.studyPartner,
    "no",
  );
});
test("editing restores every stored field, including travel", () => {
  assert.deepEqual(
    rowToForm({
      location: "Charlotte, NC",
      relationship: "adult-child",
      diagnosis_stage: "early",
      age_band: "65-74",
      study_partner: "yes",
      willing_to_travel: "short-drive",
    }),
    {
      location: "Charlotte, NC",
      relationship: "adult-child",
      diagnosisStage: "early",
      ageBand: "65-74",
      studyPartner: "yes",
      willingToTravel: "short-drive",
    },
  );
});
test("result identifiers are validated before database lookup", () => {
  assert.ok(validProfileId("b8f78089-3d07-491e-b3b0-0fa65f207803"));
  assert.equal(validProfileId(["id"]), false);
  assert.equal(validProfileId("not-a-results-link"), false);
});
