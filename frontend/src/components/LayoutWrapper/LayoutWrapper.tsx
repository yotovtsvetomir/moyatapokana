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
    pathname === '/%D0%B2%D0%BB%D0%B5%D0%B7' ||
    pathname === '/%D1%80%D0%B5%D0%B3%D0%B8%D1%81%D1%82%D1%80%D0%B0%D1%86%D0%B8%D1%8F' ||
    pathname.startsWith('/%D0%BF%D0%BE%D0%BA%D0%B0%D0%BD%D0%B8/%D0%BF%D1%80%D0%B5%D0%B3%D0%BB%D0%B5%D0%B4') ||
    pathname.startsWith('/%D0%B8%D0%B3%D1%80%D0%B8/') ||
    pathname.startsWith('/%D1%81%D0%BB%D0%B0%D0%B9%D0%B4%D1%88%D0%BE%D1%83%D1%82%D0%B0/');

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
