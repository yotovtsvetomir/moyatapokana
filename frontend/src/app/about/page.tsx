import styles from './About.module.css';

export default function AboutPage() {
  return (
    <div className="container fullHeight">
      <div className={styles.container}>
        <h1 className={styles.title}>За нас</h1>

        {/* Slogan */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">star</span>
            <h2 className={styles.blockTitle}>Покани, които впечатляват</h2>
          </div>
          <p className={styles.text}>
            Нашата цел е да направим организирането на събития лесно, стилно и незабравимо.
          </p>
        </div>

        {/* Mission */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">lightbulb</span>
            <h2 className={styles.blockTitle}>Мисия</h2>
          </div>
          <p className={styles.text}>
            Да предоставим възможността на всеки да създава красиви и адаптивни дигитални покани.
          </p>
        </div>

        {/* Vision */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">visibility</span>
            <h2 className={styles.blockTitle}>Визия</h2>
          </div>
          <p className={styles.text}>
            Насърчаваме хората да се събират повече на живо, докато се наслаждават на стилни дигитални покани, които правят всяко събитие специално.
          </p>
        </div>

        {/* Values / Promise */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">shield</span>
            <h2 className={styles.blockTitle}>Наши ценности</h2>
          </div>
          <p className={styles.text}>
            Стремим се към простота, красота и функционалност.
          </p>
        </div>
      </div>
    </div>
  );
}
