'use client';

import { useEffect, useState } from 'react';
import styles from './CookieConsent.module.css';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) setVisible(true);
    }
  }, []);

  const acceptCookies = (): void => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite">
      <div className="container">
        <div className={styles.content}>
          <span>
            Използваме бисквитки, за да подобрим Вашето преживяване на сайта.{' '}
            <a href="/privacy" className={styles.link}>Научи повече</a>
          </span>
          <button className={styles.button} onClick={acceptCookies}>
            Разбрах
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
