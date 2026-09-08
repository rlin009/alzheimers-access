'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormState = {
  location: string;
  relationship: string;
  diagnosisStage: string;
  ageBand: string;
  studyPartner: string;
  willingToTravel: string;
};

const initialState: FormState = {
  location: '',
  relationship: '',
  diagnosisStage: '',
  ageBand: '',
  studyPartner: '',
  willingToTravel: '',
};

export default function StartPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location,
          relationship: form.relationship,
          diagnosisStage: form.diagnosisStage,
          ageBand: form.ageBand,
          studyPartner: form.studyPartner,
          willingToTravel: form.willingToTravel,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        console.error(error);
        setStatus('error');
        return;
      }

      const { id } = await res.json();
      router.push(`/results?id=${id}`);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Tell us about your situation</h1>
        <p style={styles.intro}>
          Every question below is optional. Answer only what feels safe to share right now.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Location */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="location" style={styles.label}>
              Approximate location
            </label>
            <p style={styles.why}>
              Why we ask: to find things close enough to be realistic. A city or postcode area is
              enough — never your street address.
            </p>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Charlotte, NC or 28202"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              style={styles.input}
            />
          </fieldset>

          {/* Relationship */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="relationship" style={styles.label}>
              Your relationship to the person with the diagnosis
            </label>
            <p style={styles.why}>
              Why we ask: some resources are aimed at spouses, some at adult children, some at the
              person themselves. This helps point you the right way.
            </p>
            <input
              id="relationship"
              name="relationship"
              type="text"
              placeholder="e.g. daughter, spouse, myself"
              value={form.relationship}
              onChange={(e) => update('relationship', e.target.value)}
              style={styles.input}
            />
          </fieldset>

          {/* Diagnosis stage */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="diagnosisStage" style={styles.label}>
              Diagnosis stage, if known
            </label>
            <p style={styles.why}>
              Why we ask: some resources only apply at certain stages. If you don&apos;t know, or
              don&apos;t want to say, leave this blank.
            </p>
            <input
              id="diagnosisStage"
              name="diagnosisStage"
              type="text"
              placeholder="e.g. early, moderate, unsure"
              value={form.diagnosisStage}
              onChange={(e) => update('diagnosisStage', e.target.value)}
              style={styles.input}
            />
          </fieldset>

          {/* Age band */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="ageBand" style={styles.label}>
              Broad age band of the person with the diagnosis
            </label>
            <p style={styles.why}>
              Why we ask: age range affects which studies and resources are relevant. A rough
              range is all we need.
            </p>
            <select
              id="ageBand"
              name="ageBand"
              value={form.ageBand}
              onChange={(e) => update('ageBand', e.target.value)}
              style={styles.input}
            >
              <option value="">Prefer not to say</option>
              <option value="under-50">Under 50</option>
              <option value="50-64">50–64</option>
              <option value="65-74">65–74</option>
              <option value="75-84">75–84</option>
              <option value="85-plus">85 and older</option>
            </select>
          </fieldset>

          {/* Study partner */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="studyPartner" style={styles.label}>
              Is a study partner available?
            </label>
            <p style={styles.why}>
              Why we ask: many clinical studies require a family member or caregiver to
              participate alongside the person diagnosed.
            </p>
            <select
              id="studyPartner"
              name="studyPartner"
              value={form.studyPartner}
              onChange={(e) => update('studyPartner', e.target.value)}
              style={styles.input}
            >
              <option value="">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="not-sure">Not sure yet</option>
            </select>
          </fieldset>

          {/* Willingness to travel */}
          <fieldset style={styles.fieldset}>
            <label htmlFor="willingToTravel" style={styles.label}>
              Willingness to travel
            </label>
            <p style={styles.why}>
              Why we ask: some studies and resources are only available at specific sites. This
              helps us gauge distance you&apos;d consider.
            </p>
            <select
              id="willingToTravel"
              name="willingToTravel"
              value={form.willingToTravel}
              onChange={(e) => update('willingToTravel', e.target.value)}
              style={styles.input}
            >
              <option value="">Prefer not to say</option>
              <option value="local-only">Local only</option>
              <option value="short-drive">Willing to drive up to an hour</option>
              <option value="long-distance">Willing to travel further</option>
            </select>
          </fieldset>

          <button type="submit" disabled={status === 'submitting'} style={styles.button}>
            {status === 'submitting' ? 'Saving…' : 'Submit'}
          </button>

          {status === 'error' && (
            <p role="alert" style={styles.error}>
              Something went wrong saving this. Please try again.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#111111',
    padding: '24px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '640px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '28px',
    marginBottom: '12px',
    color: '#111111',
    fontWeight: 800,
  },
  intro: {
    fontSize: '18px',
    marginBottom: '32px',
    lineHeight: 1.5,
    color: '#333333',
  },
  fieldset: {
    border: 'none',
    padding: 0,
    margin: '0 0 28px 0',
  },
  label: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '6px',
    color: '#111111',
  },
  why: {
    fontSize: '16px',
    color: '#555555',
    marginBottom: '10px',
    lineHeight: 1.4,
  },
  input: {
    width: '100%',
    fontSize: '18px',
    padding: '14px',
    borderRadius: '8px',
    border: '2px solid #999999',
    backgroundColor: '#ffffff',
    color: '#111111',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    fontSize: '20px',
    fontWeight: 700,
    padding: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0B5FFF',
    color: '#ffffff',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#cc0000',
    fontSize: '16px',
    marginTop: '12px',
  },
};
