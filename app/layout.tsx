import "./globals.css";
import { Atkinson_Hyperlegible } from "next/font/google";
import type { Metadata, Viewport } from "next";

const font = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "RabiGuard – Asisten Darurat Gigitan Hewan",
  description: "Panduan awal gigitan hewan dan rabies untuk warga dan wisatawan Bali.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={font.variable}>{children}</body>
    </html>
  );
}
