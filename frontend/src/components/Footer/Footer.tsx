import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/dark_logo.svg';
import styles from './Footer.module.css';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import { TextLink } from '@/ui-components/TextLink/TextLink';
import 'flag-icons/css/flag-icons.min.css';


export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerInner}>
          {/* Logo at the top */}
          <div className={styles.desktopAlign}>
            <div className={styles.logoWrapper}>
              <Link href="/">
                <Image
                  src={logo}
                  alt="Моята Покана"
                  className={styles.logo}
                  width={120}
                  height={40}
                  priority
                />
              </Link>
            </div>

            {/* Navigation links */}
            <div className={styles.linksWrapper}>
              <nav className={styles.links} aria-label="Footer navigation">
                <TextLink color="muted" href="/about">За нас</TextLink>
                <TextLink color="muted" href="/blog">Блог</TextLink>
                <TextLink color="muted" href="/contact">Контакти</TextLink>
                <TextLink color="muted" href="/privacy">Поверителност</TextLink>
                <TextLink color="muted" href="/data-deletion">Изтриване на данни</TextLink>
                <TextLink color="muted" href="/cookies">Бисквитки</TextLink>
              </nav>
            </div>

            {/* Social icons */}
            <div className={styles.social}>
              <a
                className={styles.socialIcon}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                className={styles.socialIcon}
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF size={20} />
              </a>
            </div>
          </div>

          {/* Copyright at bottom */}
          <div className={styles.brandWrapper}>
            <span className={styles.brand}>© Моята Покана</span>
            <span className={`fi fi-bg ${styles.flag}`} title="България" aria-label="България" />
          </div>
        </div>
      </div>
    </footer>
  );
}
