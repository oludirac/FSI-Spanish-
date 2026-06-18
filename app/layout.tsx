import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FSI Spanish Drills",
  description: "Audio-first speaking drills from the FSI Spanish Basic Course",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg min-h-screen">{children}</body>
    </html>
  );
}
