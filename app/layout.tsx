import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const BRAND = {
  name: "collegeknower"
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`
  },
  description:
    "collegeknower is a premium college football quiz platform.",
  openGraph: {
    title: BRAND.name,
    description:
      "collegeknower is a premium college football quiz platform.",
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
              <Link href="/games">Games</Link>
              <Link href="/games/college-football/fbs-teams">FBS 138</Link>
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
