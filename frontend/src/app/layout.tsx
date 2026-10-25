import type { Metadata, Viewport } from "next";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Mayari | AI Voice Patient Intake for Philippine Clinics",
  description: "Mayari is a real-time AI voice patient intake and booking agent for Philippine medical clinics. Sumasagot kung hindi kaya ng clinic mo.",
  keywords: ["AI voice intake", "patient booking", "Philippines healthcare", "medical triage", "clinic booking", "Tagalog health AI"],
  authors: [{ name: "Mayari Health" }],
  icons: {
    icon: "/img/logo.jpg",
    apple: "/img/logo.jpg",
  },
  openGraph: {
    title: "Mayari | AI Voice Patient Intake",
    description: "Real-time AI voice patient intake and booking for Philippine medical clinics.",
    type: "website",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mayari | AI Voice Patient Intake",
    description: "Real-time AI voice patient intake and booking for Philippine medical clinics.",
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
            __html: `try{var t=localStorage.getItem('mayari_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'};document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
