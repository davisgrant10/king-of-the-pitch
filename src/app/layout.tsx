import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "King of the Pitch",
  description: "Individual-leaderboard 3v3 tournament control room",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
        <div className="mx-auto max-w-3xl px-4 pb-16">
          <header className="py-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Windlands Park · Grass Field 1
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight">
              King of the <span className="text-amber-700">Pitch</span>
            </h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
