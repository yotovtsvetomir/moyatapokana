import styles from './Contact.module.css';

export default function ContactPage() {
  return (
    <div className="container fullHeight">
      <div className={styles.container}>
        <h1 className={styles.title}>Свържете се с нас</h1>

        {/* Email Block */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">email</span>
            <h2 className={styles.blockTitle}>Имейл</h2>
          </div>
          <p className={styles.text}>
            За въпроси или запитвания, свържете се с нас на: <br />
            <a href="mailto:support@moyatapokana.bg" className={styles.email}>
              support@moyatapokana.bg
            </a>
          </p>
        </div>

        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">info</span>
            <h2 className={styles.blockTitle}>Инфо</h2>
          </div>
          <p className={styles.text}>
            Ще се свържем с вас в рамките на 24 часа. Не се колебайте да се свържете с нас за всеки въпрос, който имате.
          </p>
        </div>
        
        {/* Office Block */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">location_on</span>
            <h2 className={styles.blockTitle}>Офис</h2>
          </div>
          <p className={styles.text}>
            Moyatapokana.bg <br />
            ул. Уста Колю Фичето 25A, Варна, България 9010
          </p>
        </div>

        {/* Working Hours Block */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">schedule</span>
            <h2 className={styles.blockTitle}>Работно време</h2>
          </div>
          <p className={styles.text}>Пон - Пет: 9:00 – 17:00</p>
        </div>
      </div>
    </div>
  );
}
