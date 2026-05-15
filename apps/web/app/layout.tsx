import type { Metadata } from "next";
import { cookies } from "next/headers";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeModeProvider } from "@/providers/ThemeProvider";
import { serverFetch } from "@/lib/server-api";
import "./globals.css";

export const metadata: Metadata = {
  title: "VenlaxIQ — Predict. Review. Earn.",
  description: "Community prediction markets for product forecasts.",
};

async function getInitialTheme(): Promise<"dark" | "light"> {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("auth_token")?.value) return "dark";
    const profile = await serverFetch<{ user: { theme?: string } }>("/profile/me");
    return profile.user.theme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = await getInitialTheme();

  return (
    <html lang="en" data-theme={initialTheme} style={{ colorScheme: initialTheme === "light" ? "light" : "dark" }}>
      <body>
        <QueryProvider>
          <ThemeModeProvider initialTheme={initialTheme}>
            {children}
          </ThemeModeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
