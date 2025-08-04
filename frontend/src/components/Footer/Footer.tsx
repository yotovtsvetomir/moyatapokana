import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>© 2025 Цветомир Йотов - Всички права запазени.</p>
      </div>
    </footer>
  );
};

export default Footer;
