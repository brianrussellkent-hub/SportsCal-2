import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportsCal",
  description: "A clean, deployment-ready sports calendar"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
