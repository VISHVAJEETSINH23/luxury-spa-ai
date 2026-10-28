import Link from "next/link";
import { BRANCH_LIST } from "@/lib/branches";

/** Plain, readable layout shared by the privacy, terms and refund pages. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#07090b] px-5 py-16 text-[#f0e9df] sm:px-8">
      <article className="mx-auto max-w-2xl space-y-6 font-sans text-[15px] leading-relaxed [&_h2]:pt-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-[#f7f4ee] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#c5a880] hover:underline">
          ← Alexa Salon & Spa
        </Link>
        <h1 className="font-serif text-3xl text-[#f7f4ee] sm:text-4xl">{title}</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#e8ded2]/50">Last updated {updated}</p>
        {children}

        <h2>Contact</h2>
        <ul>
          {BRANCH_LIST.map((branch) => (
            <li key={branch.id}>
              <strong className="text-[#f7f4ee]">{branch.name}</strong>
              {branch.address ? ` — ${branch.address}` : ""}
              {branch.phone ? ` — +91 ${branch.phone}` : ""}
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
