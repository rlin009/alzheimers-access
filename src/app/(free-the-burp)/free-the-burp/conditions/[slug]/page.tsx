import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Tube from "../../_components/tube";
import { Blocks } from "../../_components/rich";
import { BY_SLUG, CONDITIONS, isSlug } from "@/lib/nameit/conditions";
import { getConditionPage } from "@/lib/nameit/content";
import { formatSource, getSource } from "@/lib/nameit/sources";
import { trialsFor } from "@/lib/nameit/data";

export function generateStaticParams() {
  return CONDITIONS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) return {};
  const c = BY_SLUG[slug];
  return {
    title: `${c.name}: ${c.fullName}`.replace(/^(Achalasia): Achalasia$/, "$1"),
    description: `${c.fullName} in plain words: what it is, what it feels like, how it differs from its neighbours, the test to ask for, and what the evidence says.`,
  };
}

export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const c = BY_SLUG[slug];
  const page = await getConditionPage(slug);
  const numbers = Object.fromEntries(page.citeOrder.map((k, i) => [k, i + 1]));
  const trials = trialsFor(c.label);

  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-condition">
        <aside className="ni-condition-rail" aria-label="On this page">
          <div className="ni-sticky">
            <Tube active={[slug]} id={`tube-${slug}`} className="ni-tube-rail" />
            <nav className="ni-toc" aria-label="Sections">
              {page.sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.title}
                </a>
              ))}
              <a href="#sources">Sources</a>
            </nav>
          </div>
        </aside>

        <article className="ni-article">
          <nav className="ni-crumbs" aria-label="Breadcrumb">
            <Link href="/free-the-burp">Free the Burp</Link>
            <span aria-hidden="true">/</span>
            <Link href="/free-the-burp#conditions">Conditions</Link>
          </nav>
          <p className="ni-eyebrow">{c.place}</p>
          <h1 className="ni-condition-name">{c.name}</h1>
          {c.fullName !== c.name && <p className="ni-condition-full">{c.fullName}</p>}
          <p className="ni-aka">Also called {c.alsoCalled.join(", ")}.</p>

          <dl className="ni-factcard">
            <div>
              <dt>What fails</dt>
              <dd>{c.fails}</dd>
            </div>
            <div>
              <dt>Test to ask for</dt>
              <dd>{c.test}</dd>
            </div>
            <div>
              <dt>Who to ask</dt>
              <dd>{c.specialist}</dd>
            </div>
            <div>
              <dt>Who gets it</dt>
              <dd>{c.who}</dd>
            </div>
          </dl>

          {page.sections.map((s) => (
            <section key={s.id} id={s.id} className="ni-prose-section" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="ni-h2">
                {s.title}
              </h2>
              <div className="ni-prose">
                <Blocks blocks={s.blocks} numbers={numbers} />
              </div>
            </section>
          ))}

          <section className="ni-prose-section" aria-labelledby="trials-h">
            <h2 id="trials-h" className="ni-h2">
              Studies recruiting now
            </h2>
            <div className="ni-prose">
              {trials.length === 0 ? (
                <p>
                  No study registered on ClinicalTrials.gov is recruiting people with{" "}
                  {c.name} right now.{" "}
                  <Link href="/free-the-burp/trials">See the trials for the other four conditions</Link>.
                </p>
              ) : (
                <p>
                  {trials.length} {trials.length === 1 ? "study is" : "studies are"} recruiting or
                  about to recruit people with {c.name}.{" "}
                  <Link href={`/free-the-burp/trials#${c.slug}`}>See them in plain words</Link>.
                </p>
              )}
            </div>
          </section>

          <section className="ni-neighbours" aria-labelledby="next-h">
            <h2 id="next-h" className="ni-mono-label">
              Often confused with
            </h2>
            <ul>
              {c.neighbours.map((n) => (
                <li key={n}>
                  <Link href={`/free-the-burp/conditions/${n}`}>
                    <span className="ni-neighbour-name">{BY_SLUG[n].name}</span>
                    <span className="ni-neighbour-place">{BY_SLUG[n].place}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="sources" className="ni-sources" aria-labelledby="sources-h">
            <h2 id="sources-h" className="ni-h2">
              Sources
            </h2>
            <p className="ni-muted">
              Every number on this page comes from one of these. Numbers in the text link
              here.
            </p>
            <ol>
              {page.citeOrder.map((key, i) => {
                const s = getSource(key);
                return (
                  <li key={key} id={`source-${i + 1}`}>
                    <a href={s.url} rel="noopener">
                      {formatSource(s)}
                    </a>
                    {s.pmid && <span className="ni-pmid"> PMID {s.pmid}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        </article>
      </div>
    </main>
  );
}
