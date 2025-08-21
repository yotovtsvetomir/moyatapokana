import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { cookies } from "next/headers";
import "@/styles/global.css";

import { UserProvider } from "@/context/UserContext";
import { fetchUserSSR } from "@/server/user";

import SessionTimeoutHandler from "@/utils/SessionTimeoutHandler";

import LayoutWrapper from '@/components/LayoutWrapper/LayoutWrapper'
import CookieConsent from '@/components/CookieConsent/CookieConsent';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Моята Покана",
  description: "Покани, които впечатляват.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value
  const user = await fetchUserSSR(sessionId)

  return (
    <html lang="en">
      <body className={nunito.variable}>
        <UserProvider initialUser={user}>
          <SessionTimeoutHandler />
          <LayoutWrapper>
            <main>{children}</main>
          </LayoutWrapper>
          <CookieConsent />
        </UserProvider>
      </body>
    </html>
  );
}
