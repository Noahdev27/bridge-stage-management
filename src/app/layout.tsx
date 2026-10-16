import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ToastProvider } from "@/shared/ui/ToastProvider";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Bridge — Gestion des demandes de stage",
  description:
    "Plateforme de gestion des demandes de stage — Bridge Technologies Solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="bridge" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full bg-base-200 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
