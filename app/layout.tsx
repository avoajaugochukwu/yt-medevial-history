import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AppHeader } from "@/components/common/app-header";
import { DevelopmentToolbar } from "@/components/common/development-toolbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Historia - AI Historical Storytelling Engine",
  description: "Generate cinematic Roman & Medieval historical narratives with AI-powered visual storytelling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased`}
      >
        <AppHeader />
        {children}
        <DevelopmentToolbar />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
