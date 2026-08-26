// Next.js renders every route inside this root layout.
import type { Metadata } from "next";
import "./index.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Tally",
  description: "Simple time tracking and invoicing for independent work.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Providers gives all pages access to shared login and application data. */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
