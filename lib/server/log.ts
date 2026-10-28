import "server-only";

import * as Sentry from "@sentry/nextjs";

/**
 * Structured logs: one JSON object per line, so Vercel's log search and any
 * log drain (Axiom, Better Stack) can filter by event, branch or reference.
 *
 * Never pass guest details (name, phone, email) or anything Razorpay echoes
 * back — log references and error codes only.
 */

type Fields = Record<string, string | number | boolean | null | undefined>;

function write(level: "info" | "warn" | "error", event: string, fields: Fields) {
  const line = JSON.stringify({ level, event, ...fields, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info(event: string, fields: Fields = {}) {
    write("info", event, fields);
  },
  warn(event: string, fields: Fields = {}) {
    write("warn", event, fields);
  },
  /** Logs and reports to Sentry (when SENTRY_DSN is set). */
  error(event: string, error: unknown, fields: Fields = {}) {
    const message = error instanceof Error ? error.message : String(error);
    write("error", event, { ...fields, message });
    Sentry.captureException(error instanceof Error ? error : new Error(message), {
      tags: { event },
      extra: fields,
    });
  },
};
