import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Header from "@/components/shared/Header"; // Ensure this path matches your file structure
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/providers/AuthProvider"; // Import your custom provider

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: "GenXAI Voice Funnel",
  description: "AI voice calling, lead qualification, and sales intelligence for targeted business outreach.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
       
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* <Header /> */}
            <main className="min-h-screen">
              {children} 
              <Analytics />
            </main>
            <Toaster richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
