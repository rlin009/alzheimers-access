"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProfile({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState("idle");
  async function remove() {
    setState("busy");
    try {
      const response = await fetch("/api/profiles", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("delete");
      router.push("/start?deleted=1");
    } catch { setState("error"); }
  }
  return <details className="answer-review"><summary>Delete these saved answers</summary>
    <p>This removes the answers connected to this results link. The link will stop working. It does not delete answers saved under other results links.</p>
    <label><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} /> I want to permanently delete these answers.</label>
    <p><button className="text-button" disabled={!confirm || state === "busy"} onClick={remove}>{state === "busy" ? "Deleting…" : "Delete saved answers"}</button></p>
    {state === "error" && <p role="alert">The answers could not be deleted. Please try again.</p>}
  </details>;
}
