import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { navListVariants, navItemVariants, footVariants, footItemVariants, midVariants, midItemVariants } from './animationVariants';

import Link from 'next/link';
import styles from './MobileMenu.module.css';

import { FaFacebookF, FaInstagram } from 'react-icons/fa';

import { Button } from '@/ui-components/Button/Button'

import type { Customer } from '@/utils/auth/types';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  mainLinks: { href: string; label: string }[];
}

export default function MobileMenu({
  open,
  onClose,
  customer,
  mainLinks,
}: MobileMenuProps) {
  const footControls = useAnimation();

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        footControls.start("visible");
      }, 740);
      return () => clearTimeout(timeout);
    } else {
      footControls.set("hidden");
    }
  }, [open, footControls]);

  return (
    <div
    className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
    onClick={(e) => e.stopPropagation()}
  >
    <div className='container'>
      <div className={styles.drawerContent}>
        <motion.nav
          className={styles.nav}
          initial="hidden"
          animate={open ? 'visible' : 'hidden'}
          variants={navListVariants}
        >
          <motion.ul variants={navListVariants}>
            <div className={styles.mainLinks}>
              {mainLinks.map((link) => (
                <motion.li key={link.href} variants={navItemVariants}>
                  <Link href={link.href} onClick={onClose}>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </div>
          </motion.ul>
        </motion.nav>

        {!customer && (
          <div style={{marginTop: 'auto'}}>
            <hr/>
            <motion.div
              className={styles.accountWrapper}
              variants={midVariants}
              initial="hidden"
              animate={footControls}
            >
              <motion.div className={styles.accCta} variants={midItemVariants}>
                <p>Създавай и споделяй покани лесно.</p>
              </motion.div>

              <motion.div className={styles.account} variants={midItemVariants}>
                <Link href="/login" onClick={onClose}>
                  <Button size="large" variant="secondary">Вход</Button>
                </Link>
                <Link href="/register" onClick={onClose}>
                  <Button size="large" variant="secondary">Регистрация</Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        )}

        <div style={{marginTop: 'auto'}}>
          <hr/>
          <motion.div
            className={styles.foot}
            variants={footVariants}
            initial="hidden"
            animate={footControls}
          >

            <motion.div className={styles.cta} variants={footItemVariants}>
              <p>Покани, които впечатляват</p>
            </motion.div>

            <motion.div className={styles.socials} variants={footItemVariants}>
              <a className={styles.socialIcon} href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebookF size={20} />
              </a>
              <a className={styles.socialIcon} href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={20} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
  );
}
