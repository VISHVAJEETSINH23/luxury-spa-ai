"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

const MESSAGES: Record<string, string> = {
  WRONG_PASSWORD: "Wrong password.",
  TOO_MANY_ATTEMPTS: "Too many tries. Wait 15 minutes and try again.",
};

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        window.location.replace("/admin");
        return;
      }
      setError(MESSAGES[data.error] ?? "Couldn't sign in. Try again.");
    } catch {
      setError("No connection. Check the internet and try again.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090b] px-4 text-[#f7f4ee]">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 rounded-3xl border border-white/10 bg-[#0b0f12] p-7">
        <div className="space-y-2">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#c5a880]">
            <Lock className="h-3.5 w-3.5" /> Owner login
          </span>
          <h1 className="font-serif text-2xl">Alexa Salon & Spa bookings</h1>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs text-[#e8ded2]/60">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-base focus:border-[#c5a880] focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-[#e0785e]">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#c5a880] px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#07090b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </main>
  );
}
