"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Last-resort screen when the whole app crashes. Reports, then offers a reload. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#07090b", color: "#f7f4ee", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong.</h1>
            <p style={{ opacity: 0.7, marginBottom: 24 }}>
              Please try again. To book right away, call or WhatsApp the spa.
            </p>
            <button
              onClick={reset}
              style={{ padding: "10px 20px", border: "1px solid #c5a880", color: "#c5a880", background: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
