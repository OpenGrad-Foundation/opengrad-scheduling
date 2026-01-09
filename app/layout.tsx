import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenGrad Scheduling - Mentor-Mentee Interview Booking",
  description: "Schedule and book interview sessions with mentors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="grow">
              {children}
            </main>
            <footer className="py-6 border-t text-center text-sm text-gray-500 bg-white">
              Powered by Enphase Energy
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
