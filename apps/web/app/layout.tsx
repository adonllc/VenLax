import type { Metadata } from "next";
import { ThemeProvider } from "@venlaxiq/ui";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VenlaxIQ — Predict. Review. Earn.",
  description: "Community prediction markets for product forecasts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
