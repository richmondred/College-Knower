import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CursorBackdrop } from "@/components/CursorBackdrop";
import "./globals.css";

const BRAND = {
  name: "ball knowers"
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`
  },
  description:
    "ball knowers is a sports quiz platform for people who know ball.",
  openGraph: {
    title: BRAND.name,
    description:
      "ball knowers is a sports quiz platform for people who know ball.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CursorBackdrop />
        <div className="shell">
          <header className="site-header">
            <Link className="brand-mark" href="/">
              <Image
                className="brand-logo"
                src="/american-tj-logo.png"
                width={34}
                height={34}
                alt=""
                aria-hidden="true"
                priority
              />
              <span>{BRAND.name}</span>
            </Link>
            <nav className="site-nav" aria-label="Primary">
              <Link href="/games/college-football">College Football Knowers</Link>
              <Link href="/games/nfl">NFL Knowers</Link>
              <Link href="/games/english-football">English Football Knowers</Link>
              <Link href="/games/european-football">European Football Knowers</Link>
              <Link href="/games/world-football">World Football Knowers</Link>
              <Link href="/games/college-football/fbs-teams/leaderboard">Leaderboard</Link>
              <Link href="/profile">Profile</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
