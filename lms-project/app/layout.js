import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/header";
import Footer from "../components/footer";
import { Suspense } from "react";

// Configure Inter font with proper display settings
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif']
});

export const metadata = {
  title: "LearnHub - Online Learning Platform",
  description: "Transform your future with online learning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent browser extensions from causing hydration mismatches */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Suspense>
      </body>
    </html>
  );
}