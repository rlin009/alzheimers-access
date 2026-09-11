"use client";
import Link from "next/link";
import { useState } from "react";
import {
  CaretDownIcon,
  MapPinIcon,
  ArrowUpRightIcon,
} from "../components/icons";
import { displayAnswer, fields, type FormState } from "@/lib/profile";
export type TrialView = {
  id: string;
  title: string;
  site: string;
  siteLabel: string;
  notes: string[];
};
export type GroupView = {
  id: string;
  heading: string;
  trials: TrialView[];
  defaultOpen: boolean;
};
function TrialGroup({ group, query }: { group: GroupView; query: string }) {
  const [limit, setLimit] = useState(3);
  const matches = group.trials.filter((trial) =>
    (trial.title + " " + trial.site)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <details className="trial-group" id={group.id} open={group.defaultOpen}>
      <summary>
        <span>
          {group.heading} ({query ? matches.length + " of " : ""}
          {group.trials.length})
        </span>
        <CaretDownIcon size={24} aria-hidden />
      </summary>
      {matches.length ? (
        <>
          <ul className="trial-list">
            {matches.slice(0, limit).map((trial) => (
              <li className="trial-card" key={trial.id}>
                <h3>{trial.title}</h3>
                <p className="trial-site">
                  <MapPinIcon size={22} aria-hidden />
                  <span>
                    {trial.siteLabel}: {trial.site}
                  </span>
                </p>
                {trial.notes.length > 0 && (
                  <ul className="trial-notes">
                    {trial.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                )}
                <a
                  className="trial-link"
                  href={
                    "https://clinicaltrials.gov/study/" +
                    encodeURIComponent(trial.id)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    "View " +
                    trial.title +
                    " on ClinicalTrials.gov (opens in a new tab)"
                  }
                >
                  View on ClinicalTrials.gov{" "}
                  <ArrowUpRightIcon size={22} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          {limit < matches.length && (
            <div className="more-row">
              <button
                type="button"
                className="text-button"
                onClick={() => setLimit(limit + 10)}
              >
                Show more in this list <CaretDownIcon size={22} aria-hidden />
                <span className="sr-only"> — {group.heading}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="list-empty">
          {query
            ? "No trials in this list contain those words."
            : "No trials in this list for these answers."}
        </p>
      )}
    </details>
  );
}
export default function ResultsList({
  groups,
  form,
  profileId,
}: {
  groups: GroupView[];
  form: FormState;
  profileId: string;
}) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const total = groups.reduce((sum, group) => sum + group.trials.length, 0);
  const matched = groups.reduce(
    (sum, group) =>
      sum +
      group.trials.filter((trial) =>
        (trial.title + " " + trial.site)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ).length,
    0,
  );
  return (
    <>
      <div className="results-toolbar">
        <div className="answers-controls">
          <strong>Your answers</strong>
          <Link href={"/start?id=" + encodeURIComponent(profileId)}>
            Edit answers
          </Link>
        </div>
        <form
          className="results-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draft.trim());
          }}
        >
          <div>
            <label htmlFor="trial-search">Search these trial listings</label>
            <input
              id="trial-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Trial name or recruiting site"
            />
          </div>
          <button className="button button-indigo" type="submit">
            Search
          </button>
        </form>
      </div>
      <details className="answer-review">
        <summary>Review your answers</summary>
        <dl className="answer-list">
          {fields.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{displayAnswer(field.key, form[field.key])}</dd>
            </div>
          ))}
        </dl>
      </details>
      <nav className="group-jumps" aria-label="Jump to a trial list">
        {groups.map((group) => (
          <a key={group.id} href={"#" + group.id}>
            {group.heading}
          </a>
        ))}
      </nav>
      {query && (
        <div className="search-status" role="status">
          <p>
            {matched
              ? matched + " of " + total + " listings contain “" + query + "”."
              : "No trials contain those words."}
          </p>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setDraft("");
            }}
          >
            Clear search
          </button>
        </div>
      )}
      {total === 0 && (
        <p className="notice">
          There are no recruiting trial listings to show right now. This is not
          a decision about taking part in a trial.
        </p>
      )}
      {groups.map((group) => (
        <TrialGroup key={group.id + query} group={group} query={query} />
      ))}
      <details className="disclosure preparation">
        <summary>
          Questions to ask a trial coordinator
          <CaretDownIcon size={24} aria-hidden />
        </summary>
        <div className="disclosure-content">
          <ul>
            <li>Is this site still recruiting?</li>
            <li>
              Is a study partner needed, and which visits would they attend?
            </li>
            <li>
              What appointments, tests, travel, and costs would taking part
              involve?
            </li>
          </ul>
          <p>
            The coordinator’s contact details are on the trial’s
            ClinicalTrials.gov page.
          </p>
        </div>
      </details>
    </>
  );
}
