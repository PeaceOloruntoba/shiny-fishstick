"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export function EarlyAccessForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const result = (await response.json()) as { message?: string };
      setMessage(result.message ?? "Please try again shortly.");
      if (response.ok) form.reset();
    } catch {
      setMessage("We couldn't connect just now. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="interest-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Your email address</label>
      <div className="input-row">
        <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} required />
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Keep me posted"} <ArrowRight size={16} />
        </button>
      </div>
      <small>We’ll only use your email for HomeOps launch updates.</small>
      <p className="form-status" aria-live="polite" role="status">{message}</p>
    </form>
  );
}
