'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Customer } from '@/utils/auth/types';
import Link from 'next/link';
import Image from 'next/image';
import DefaultAvatar from '@/assets/avatar.png';

import { motion, AnimatePresence } from 'framer-motion';

import styles from './ProfileMenu.module.css';


interface ProfileMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  customer?: Customer | null;
}

export default function ProfileMenu({ open, onClose, customer, anchorRef }: ProfileMenuProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const pathname = usePathname();

  const avatarSrc = customer?.avatar?.startsWith('http')
    ? customer.avatar
    : DefaultAvatar;

  useEffect(() => {
    if (open && dropdownRef.current) {
      const height = dropdownRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          className={styles.dropdown}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: contentHeight ?? 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <div className='container'>
            <div className={styles.profile}>
              <div className={styles.profileAvatar}>
                <Image
                  src={avatarSrc}
                  alt="User Avatar"
                  width={47}
                  height={47}
                  className={styles.avatarImage}
                />
                <div className={styles.statusDot} />
              </div>
              <div className={styles.profileContent}>
                <h5>
                  {customer?.user
                    ? `${customer.user.first_name} ${customer.user.last_name}`.trim()
                    : 'Потребител'}
                </h5>
                <p>
                  {customer?.user?.email || 'example@email.com'}
                </p>    
              </div>
            </div>

            <div className={styles.dropdownInner}>
              <Link
                key="/profile/invitations"
                href="/profile/invitations"
                className={`${styles.dropdownItem} ${pathname === '/profile/invitations' ? styles.selected : ''}`}
                onClick={onClose}
              >
                <span className="material-symbols-outlined">mail</span>
                <p>Покани</p>
              </Link>

              <Link
                key="/profile/orders"
                href="/profile/orders"
                className={`${styles.dropdownItem} ${pathname === '/profile/orders' ? styles.selected : ''}`}
                onClick={onClose}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                <p>Поръчки</p>
              </Link>

              <Link
                key="/profile/info"
                href="/profile/info"
                className={`${styles.dropdownItem} ${pathname === '/profile/info' ? styles.selected : ''}`}
                onClick={onClose}
              >
                <span className="material-symbols-outlined">manage_accounts</span>
                <p>Настройки</p>
              </Link>

              <Link 
                key='logout'
                href='/profile/logout'
                className={`${styles.dropdownItem} ${styles.logout}`}
                onClick={onClose}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>logout</span>
                <p>Изход</p>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
