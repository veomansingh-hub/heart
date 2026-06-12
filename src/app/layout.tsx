import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import WebGLCanvas from "@/components/WebGLCanvas";
import FalakLogo from "@/components/FalakLogo";
import MusicPlayer from "@/components/MusicPlayer";
import EcgBackground from "@/components/EcgBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Falakraj — AIIMS Nurse & Interactive Portfolio",
  description: "A premium interactive layout detailing being a nurse at AIIMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fdfdfd] text-zinc-900 selection:bg-red-400 selection:text-white overflow-x-hidden">
        {/* WebGL background layer */}
        <WebGLCanvas />
        
        {/* Glowing Red EKG background monitor line */}
        <EcgBackground />
        
        {/* Top-left morphing logo (Falakraj <-> Bumblebee) */}
        <FalakLogo />

        {/* Ambient music controller */}
        <MusicPlayer />

        {/* Scroll and cursor wrapper */}
        <SmoothScroll>
          <Cursor />
          <div className="relative z-10 w-full min-h-screen flex flex-col pointer-events-none">
            <div className="w-full flex-1 pointer-events-auto">
              {children}
            </div>
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
