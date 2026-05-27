import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Haliya | AI-Powered Health Triage for the Philippines",
  description: "Intelligent health assessment and trend monitoring for the Philippines. Get instant AI-powered symptom analysis, book appointments, and contribute to community health intelligence.",
  keywords: ["health triage", "AI health", "symptom checker", "Philippines healthcare", "medical assessment", "appointment booking"],
  authors: [{ name: "Haliya Health Team" }],
  icons: {
    icon: "/img/logo.jpg",
    apple: "/img/logo.jpg",
  },
  openGraph: {
    title: "Haliya | AI-Powered Health Triage",
    description: "Intelligent health assessment and trend monitoring for the Philippines",
    type: "website",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haliya | AI-Powered Health Triage",
    description: "Intelligent health assessment and trend monitoring for the Philippines",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('haliya_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'};document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
