import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Navigation from "@/components/Navigation";
import Link from "next/link";

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
            <footer className="py-8 border-t bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm text-gray-500 text-center">
                   Powered by Enphase Energy
                  </div>
                  <div className="flex gap-6">
                    <Link href="/privacypolicy" className="text-sm text-gray-500 hover:text-teal-600 transition-colors text-center">
                      Privacy Policy
                    </Link>
                    <Link href="/termsandconditions" className="text-sm text-gray-500 hover:text-teal-600 transition-colors text-center">
                      Terms and Conditions
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
