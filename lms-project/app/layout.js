import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/header";
import Footer from "../components/footer";

// Configure Inter font with proper display settings
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // This prevents FOIT (Flash of Invisible Text)
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
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}