'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({
  children,
}: LayoutWrapperProps) {
  const pathname = usePathname();

  const hideLayout =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/invitations/preview');

  return (
    <>
      {!hideLayout && (
        <Header />
      )}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
