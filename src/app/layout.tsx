import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import DynamicFavicon from "@/components/DynamicFavicon";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Start Page Dashboard",
  description: "A modern, customizable start page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0f0f1a] text-white`}
      >
        <DynamicFavicon />
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(30, 30, 50, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
