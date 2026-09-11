import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  NotePencilIcon,
  ListBulletsIcon,
  ChatCircleDotsIcon,
  CaretDownIcon,
} from "./components/icons";
export default function Home() {
  const steps = [
    {
      Icon: NotePencilIcon,
      title: "1. Share what you can",
      text: "Six questions. All optional.",
    },
    {
      Icon: ListBulletsIcon,
      title: "2. Explore the three lists",
      text: "A starting point for a conversation.",
    },
    {
      Icon: ChatCircleDotsIcon,
      title: "3. Ask a trial coordinator",
      text: "They can explain what taking part involves.",
    },
  ];
  return (
    <main id="main-content" className="page-shell home-page">
      <section className="home-hero" aria-labelledby="home-heading">
        <div className="hero-copy">
          <h1 id="home-heading">
            <span>Find clinical trials and</span> <span>local support for</span>{" "}
            <span>Alzheimer’s and dementia</span>
          </h1>
          <p>
            For families caring for a loved one with Alzheimer’s or dementia,
            this site helps you find clinical trials they may qualify for and
            resources near you, including care support and respite services.
          </p>
          <p className="founder-line">
            Built by a high schooler in memory of my grandfather.
          </p>
          <div className="hero-actions">
            <Link href="/start" className="button button-butter">
              Get Started <ArrowRightIcon size={24} aria-hidden />
            </Link>
            <Link className="hero-secondary" href="/support">
              Find local support
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <Image
            src="/images/family-at-home.webp"
            alt="An older woman and her adult daughter looking through a notebook together at home."
            width={1374}
            height={1145}
            sizes="(max-width: 800px) 100vw, 50vw"
            priority
          />
        </div>
      </section>
      <section className="steps-section" aria-labelledby="steps-heading">
        <h2 id="steps-heading">A clear place to begin</h2>
        <ol className="steps">
          {steps.map(({ Icon, title, text }) => (
            <li key={title}>
              <span className="step-icon">
                <Icon size={32} aria-hidden />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="home-support" aria-labelledby="support-heading">
        <div>
          <h2 id="support-heading">Help with day-to-day care</h2>
          <p>Find care support, respite services, and someone to call.</p>
          <Link className="text-action" href="/support">
            Browse local support <ArrowRightIcon size={24} aria-hidden />
          </Link>
        </div>
        <Image
          src="/images/support-at-home.png"
          alt=""
          width={1870}
          height={841}
          sizes="360px"
        />
      </section>
      <section className="faq-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Frequently asked questions</h2>
        <details className="disclosure">
          <summary>
            Do I have to answer every question?
            <CaretDownIcon aria-hidden size={24} />
          </summary>
          <p>
            No. Every question is optional. Answer only what feels safe to
            share.
          </p>
        </details>
        <details className="disclosure">
          <summary>
            Does a match mean we can join?
            <CaretDownIcon aria-hidden size={24} />
          </summary>
          <p>
            The lists are a starting point. The trial coordinator can explain
            whether taking part may be possible.{" "}
            <Link href="/how-it-works">Read how the lists work</Link>.
          </p>
        </details>
      </section>
    </main>
  );
}
