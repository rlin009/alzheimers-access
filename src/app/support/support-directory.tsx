"use client";
import { useState } from "react";
import { PhoneIcon, GlobeIcon, ArrowUpRightIcon } from "../components/icons";
import type { SupportProvider } from "@/lib/support";
export default function SupportDirectory({
  providers,
}: {
  providers: SupportProvider[];
}) {
  const [location, setLocation] = useState("Charlotte, NC");
  const [category, setCategory] = useState("all");
  const [applied, setApplied] = useState({
    location: "Charlotte, NC",
    category: "all",
  });
  const normalized = applied.location.trim().toLowerCase();
  const local =
    !normalized ||
    /\bcharlotte\b|\bmecklenburg\b/.test(normalized) ||
    ["nc", "north carolina"].includes(normalized);
  const results = local
    ? providers.filter(
        (provider) =>
          applied.category === "all" || provider.category === applied.category,
      )
    : [];
  return (
    <div className="support-body">
      <form
        className="support-search"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ location, category });
        }}
      >
        <div>
          <label htmlFor="support-location">City or state</label>
          <input
            id="support-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City or state"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="support-type">Type of support</label>
          <select
            id="support-type"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All support</option>
            <option value="finding-care">Help finding care</option>
            <option value="caregiver-support">Caregiver support</option>
            <option value="adult-day">Adult day services</option>
            <option value="medical-care">Medical care</option>
            <option value="legal-help">Legal help</option>
          </select>
        </div>
        <button className="button button-indigo" type="submit">
          Find support
        </button>
      </form>
      <p className="notice">
        This directory currently focuses on the Charlotte, NC area. Check with
        each organization before making plans.
      </p>
      <div role="status">
        <p className="section-count">
          {results.length
            ? results.length +
              (results.length === 1
                ? " organization in the Charlotte area"
                : " organizations in the Charlotte area")
            : local
              ? "No listings in this category here yet."
              : "We haven’t added local listings for this area yet."}
        </p>
      </div>
      {!results.length && (
        <button
          className="text-button"
          onClick={() => {
            setLocation("Charlotte, NC");
            setCategory("all");
            setApplied({ location: "Charlotte, NC", category: "all" });
          }}
        >
          Show all Charlotte-area support
        </button>
      )}
      <ul className="support-list">
        {results.map((provider) => (
          <li className="provider" key={provider.name}>
            <div>
              <h2>{provider.name}</h2>
              <p>{provider.area}</p>
              <p className="verified-date">
                Checked{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(provider.checked + "T12:00:00Z"))}{" "}
                {provider.method}
              </p>
            </div>
            <div className="provider-actions">
              <a
                className="button button-outline"
                href={"tel:+1" + provider.phone.replace(/\D/g, "")}
              >
                <PhoneIcon size={23} aria-hidden />
                Call {provider.phone}
              </a>
              <a
                className="button button-outline"
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  "Visit " + provider.name + " website (opens in a new tab)"
                }
              >
                <GlobeIcon size={23} aria-hidden />
                Visit website <ArrowUpRightIcon size={20} aria-hidden />
              </a>
            </div>
          </li>
        ))}
      </ul>
      <section className="elsewhere">
        <h2>Looking elsewhere?</h2>
        <a
          className="text-action"
          href="https://eldercare.acl.gov/home"
          target="_blank"
          rel="noopener noreferrer"
        >
          Search the Eldercare Locator{" "}
          <ArrowUpRightIcon size={22} aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>
    </div>
  );
}
