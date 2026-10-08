"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Tube from "./tube";
import type { Condition, Label, Slug } from "@/lib/nameit/conditions";
import type { Phrase } from "@/lib/nameit/content";

type Props = {
  phrases: Phrase[];
  groups: { id: string; title: string }[];
  conditions: Condition[];
};

export default function Finder({ phrases, groups, conditions }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const byLabel = useMemo(
    () => Object.fromEntries(conditions.map((c) => [c.label, c])) as Record<Label, Condition>,
    [conditions],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const q = query.trim().toLowerCase();
  const visible = (p: Phrase) => !q || p.phrase.toLowerCase().includes(q);
  const shownCount = phrases.filter(visible).length;

  const chosen = phrases.filter((p) => selected.includes(p.id));
  const results = conditions
    .map((c) => ({ condition: c, matches: chosen.filter((p) => p.conditions.includes(c.label)) }))
    .filter((r) => r.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length);
  const activeSlugs: Slug[] = results.map((r) => r.condition.slug);

  return (
    <div className="ni-finder">
      <div className="ni-finder-main">
        <section className="ni-hero" aria-labelledby="hero-title">
          <p className="ni-eyebrow">Five swallowing conditions, one tube</p>
          <h1 id="hero-title" className="ni-hero-title">
            You can&rsquo;t look up a word nobody has told&nbsp;you.
          </h1>
          <p className="ni-lede">
            Start from what you notice, in your own words. Free the Burp shows which
            conditions those words belong to, how to tell them apart, and the test
            to ask a doctor for by name.
          </p>
        </section>

        <section className="ni-picker" aria-labelledby="picker-title">
          <div className="ni-picker-head">
            <h2 id="picker-title" className="ni-h2">
              What do you notice?
            </h2>
            <p className="ni-muted">Choose as many as sound like you.</p>
          </div>
          <label className="ni-search">
            <span className="ni-visually-hidden">Filter the phrases</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter, for example “burp” or “throat”"
              autoComplete="off"
            />
          </label>
          {shownCount === 0 && (
            <p className="ni-muted ni-empty">
              No phrase contains &ldquo;{query}&rdquo;. Try a shorter word, such as
              &ldquo;food&rdquo;, &ldquo;chest&rdquo; or &ldquo;air&rdquo;.
            </p>
          )}
          {groups.map((g) => {
            const items = phrases.filter((p) => p.group === g.id && visible(p));
            if (!items.length) return null;
            return (
              <fieldset key={g.id} className="ni-group">
                <legend className="ni-mono-label">{g.title}</legend>
                <div className="ni-chips">
                  {items.map((p) => {
                    const pressed = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="ni-chip"
                        aria-pressed={pressed}
                        onClick={() => toggle(p.id)}
                      >
                        {p.phrase}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </section>

        <section className="ni-results" aria-labelledby="results-title" aria-live="polite">
          <div className="ni-results-head">
            <h2 id="results-title" className="ni-h2">
              Names to ask about
            </h2>
            {selected.length > 0 && (
              <button type="button" className="ni-textbutton" onClick={() => setSelected([])}>
                Clear {selected.length} chosen
              </button>
            )}
          </div>

          {results.length > 0 && <Tube active={activeSlugs} id="tube-mobile" className="ni-tube-mobile" />}

          {results.length === 0 ? (
            <p className="ni-results-empty">
              Nothing chosen yet. Pick anything above that sounds like you, and the
              conditions those words belong to will show up here.
            </p>
          ) : (
            <>
              <p className="ni-caution">
                This is not a diagnosis. Several of these can only be told apart with
                a test, and some of these symptoms have other causes. Take the names
                and the tests to a doctor.
              </p>
              <ol className="ni-result-list">
                {results.map(({ condition: c, matches }) => (
                  <li key={c.slug} className="ni-result">
                    <div className="ni-result-top">
                      <p className="ni-result-count">
                        {matches.length} of your {chosen.length === 1 ? "word" : "words"}
                      </p>
                      <h3 className="ni-result-name">{c.name}</h3>
                      <p className="ni-result-full">{c.fullName}</p>
                      <p className="ni-result-place">{c.place}</p>
                    </div>
                    <ul className="ni-why">
                      {matches.map((m) => (
                        <li key={m.id}>
                          <span className="ni-why-phrase">&ldquo;{m.phrase}&rdquo;</span>
                          {m.conditions.length > 1 && (
                            <span className="ni-why-note">
                              Also points to{" "}
                              {m.conditions
                                .filter((l) => l !== c.label)
                                .map((l) => byLabel[l].name)
                                .join(" and ")}
                              . {m.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <dl className="ni-ask">
                      <div>
                        <dt>Test to ask for</dt>
                        <dd>{c.test}</dd>
                      </div>
                      <div>
                        <dt>Who to ask</dt>
                        <dd>{c.specialist}</dd>
                      </div>
                    </dl>
                    <Link className="ni-arrowlink" href={`/free-the-burp/conditions/${c.slug}`}>
                      Read about {c.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>

      {selected.length > 0 && (
        <a className="ni-jumpbar" href="#results-title">
          <span>
            {selected.length} chosen · {results.length} {results.length === 1 ? "name" : "names"}
          </span>
          <span>See them ↓</span>
        </a>
      )}

      <aside className="ni-finder-side" aria-label="Where each condition happens">
        <div className="ni-sticky">
          <Tube active={activeSlugs} id="tube-desktop" />
          <p className="ni-tube-caption">
            {activeSlugs.length
              ? "Lit up: where the conditions behind your words happen."
              : "Each condition sits at a different height on the same tube."}
          </p>
        </div>
      </aside>
    </div>
  );
}
