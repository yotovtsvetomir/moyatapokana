'use client';

import React, { useState, useRef, useEffect, RefObject } from "react";

import Link from "next/link";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";

import { usePathname } from 'next/navigation';
import { useMediaQuery } from 'usehooks-ts';

import styles from "./Header.module.css";

import { useUser } from '@/context/UserContext';

import Logo from "@/assets/main_logo.svg";
import LogoMixed from "@/assets/mixed_logo.svg";
import DefaultAvatar from '@/assets/avatar.png';

import { Button } from '@/ui-components/Button/Button';
import MobileMenu from '@/ui-components/MobileMenu/MobileMenu';
import ProfileMenu from '@/ui-components/ProfileMenu/ProfileMenu';
import SearchOverlay from '@/ui-components/SearchOverlay/SearchOverlay';

export default function HeaderClient() {
  const { user } = useUser();
  const pathname = usePathname();
  const isXL = useMediaQuery('(min-width: 1280px)');
  const isL = useMediaQuery('(min-width: 980px)');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const profileIconButtonRef = useRef<HTMLButtonElement>(null);
  const profileAvatarButtonRef = useRef<HTMLButtonElement>(null);
  const activeRef = (isL ? profileAvatarButtonRef : profileIconButtonRef) as RefObject<HTMLElement>;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const scrollYRef = useRef(0);

  const avatarSrc = user?.profile_picture?.startsWith('http')
    ? user.profile_picture
    : DefaultAvatar;

  const mainLinks = [
    { href: '/', label: 'Начало' },
    { href: '/templates', label: 'Шаблони' },
    { href: '/invitations/create', label: 'Създай' },
    { href: '/blog', label: 'Блог' },
    { href: '/about', label: 'За нас' },
    { href: '/contact', label: 'Контакти' },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);
  
  useEffect(() => {
    const body = document.body;

    if (isMenuOpen) {
      scrollYRef.current = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollYRef.current}px`;
      body.style.overflow = 'hidden';
      body.style.width = '100%';
    } else {
      body.style.position = '';
      body.style.top = '';
      body.style.overflow = '';
      body.style.width = '';
    }

    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.overflow = '';
      body.style.width = '';
    };
  }, [isMenuOpen]);

  if (!isClient) return null;

  return (
    <>
      <header 
        ref={headerRef}
        className={`${styles.header} 
                    ${isMenuOpen ? styles.menuOpen : ''} 
                    ${isMenuOpen ? styles.menuActive : ''} 
                    ${styles.menuReveal}`}
      >
        <div className={styles.headerContainer}>
          <div className={styles.headerGrid}>
            <div className={styles.headerGroup}>
              <Link href="/" className={styles.logoLink} onClick={() => setIsMenuOpen(false)}>
                <Image
                  src={Logo}
                  alt="Logo"
                  className={`${styles.logoImage} ${!isMenuOpen ? styles.visible : styles.hidden}`}
                />
                <Image
                  src={LogoMixed}
                  alt="Logo"
                  className={`${styles.logoImage} ${isMenuOpen ? styles.visible : styles.hidden}`}
                />
              </Link>
            </div>

            <div className={styles.headerGroup}>
              {/* Mobile */}
              <button
                className={styles.iconButton}
                aria-label={isSearchOpen ? "Затвори търсене" : "Отвори търсене"}
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setIsMenuOpen(false);
                }}
              >
                <span className={`material-symbols-outlined ${styles.icon}`}>search</span>
              </button>

              {user && (
                <button
                  ref={profileIconButtonRef}
                  className={`${styles.iconButton} ${isProfileMenuOpen ? styles.iconButtonActive : ''}`}
                  aria-label="Профил"
                  onClick={() => {
                    setIsProfileMenuOpen(prev => !prev);
                    setIsSearchOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  <span className={`material-symbols-outlined ${styles.icon}`}>
                    account_circle
                  </span>
                </button>
              )}

              <button
                className={`${styles.iconButton} ${styles.menuButton}`}
                aria-label={isMenuOpen ? "Затвори меню" : "Отвори меню"}
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsSearchOpen(false);
                }}
              >
                <span className={`material-symbols-outlined ${styles.icon}`}>
                  {isMenuOpen ? "close" : "menu"}
                </span>
              </button>

              {/* Desktop */}
              <nav className={styles.desktopNav}>
                <ul className={styles.navList}>
                  {mainLinks.slice(1).map((link) => (
                    <li key={link.href} className={styles.navItem}>
                      <Link 
                        href={link.href}
                        className={`${styles.navLink} ${pathname === link.href ? styles.selected : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {user ? (
                <button
                  ref={profileAvatarButtonRef}
                  className={`${styles.profileAvatar} ${isProfileMenuOpen ? styles.iconButtonActive : ''}`}
                  onClick={() => {
                    setIsProfileMenuOpen(prev => !prev);
                    setIsSearchOpen(false);
                    setIsMenuOpen(false);
                  }}
                  aria-label="Профил"
                >
                  <Image
                    src={avatarSrc}
                    alt="User Avatar"
                    width={42}
                    height={42}
                    unoptimized
                    className={styles.avatarImage}
                  />
                  <div className={styles.statusDot} />
                </button>
              ) : (
                <div className={styles.logregDesktop}>
                  <Link href="/login">
                    <Button variant="secondary" size={isXL ? 'large' : undefined}>Вход</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="secondary" size={isXL ? 'large' : undefined}>Регистрация</Button>
                  </Link>
                </div>
              )}

              {isL && (
                <button
                  className={styles.desktopSearchButton}
                  aria-label={isSearchOpen ? "Затвори търсене" : "Отвори търсене"}
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    setIsMenuOpen(false);
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isSearchOpen ? (
                      <motion.span
                        key="close"
                        className={`material-symbols-outlined ${styles.icon}`}
                        initial={{ y: -16 }}
                        animate={{ y: 0 }}
                        exit={{ y: 16 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                      >
                        close
                      </motion.span>
                    ) : (
                      <motion.span
                        key="search"
                        className={`material-symbols-outlined ${styles.icon}`}
                        initial={{ y: -16 }}
                        animate={{ y: 0 }}
                        exit={{ y: 16 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                      >
                        search
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        mainLinks={mainLinks}
        user={user}
      />

      <ProfileMenu
        open={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        anchorRef={activeRef}
        user={user}
      />

      <SearchOverlay
        headerRef={headerRef}
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
