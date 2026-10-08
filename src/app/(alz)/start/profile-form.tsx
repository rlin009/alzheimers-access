"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { fields, type FormState } from "@/lib/profile";
export default function ProfileForm({
  initial,
  profileId,
  notice,
}: {
  initial: FormState;
  profileId?: string;
  notice?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const busy = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setStatus("submitting");
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("save");
      const data = await response.json();
      if (typeof data.id !== "string") throw new Error("save");
      router.push("/results?id=" + encodeURIComponent(data.id));
    } catch {
      setStatus("error");
      busy.current = false;
    }
  }
  return (
    <div className="form-body">
      {notice && <p className="notice">{notice}</p>}
      <form onSubmit={submit} aria-busy={status === "submitting"}>
        {[fields.filter(f => f.key === "location" || f.key === "ageBand"), fields.slice(4)].map((group, index) => (
          <fieldset key={index}>
            <legend>{index === 0 ? "Your situation" : "Taking part"}</legend>
            {group.map((field) => (
              <div className="form-field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <p className="why" id={field.key + "-help"}>
                  Why we ask: {field.why}
                </p>
                {"options" in field ? (
                  <select
                    id={field.key}
                    name={field.key}
                    value={form[field.key]}
                    aria-describedby={field.key + "-help"}
                    onChange={(event) =>
                      setForm({ ...form, [field.key]: event.target.value })
                    }
                  >
                    {!field.options.some(
                      (option) => option[0] === form[field.key],
                    ) && (
                      <option value={form[field.key]}>{form[field.key]}</option>
                    )}
                    {field.options.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    type="text"
                    autoComplete="off"
                    maxLength={200}
                    placeholder="e.g. Charlotte, NC"
                    value={form[field.key]}
                    aria-describedby={field.key + "-help"}
                    onChange={(event) =>
                      setForm({ ...form, [field.key]: event.target.value })
                    }
                  />
                )}
              </div>
            ))}
          </fieldset>
        ))}
        {status === "error" && (
          <p className="error-message" role="alert">
            We couldn’t save your answers. Please try again. Your answers are
            still here.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button button-butter"
            type="submit"
            disabled={status === "submitting"}
          >
            {status === "submitting"
              ? "Finding trials…"
              : profileId
                ? "Update results"
                : "Submit"}
          </button>
          {profileId && (
            <Link
              className="text-action"
              href={"/results?id=" + encodeURIComponent(profileId)}
            >
              Cancel
            </Link>
          )}
        </div>
        <p className="form-privacy">
          <Link className="text-action" href="/privacy">
            About your privacy
          </Link>
        </p>
        <div className="sr-only" role="status">
          {status === "submitting"
            ? "Saving your answers and opening trial listings."
            : ""}
        </div>
      </form>
    </div>
  );
}
