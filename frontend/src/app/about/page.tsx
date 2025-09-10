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
            Да насърчаваме хората да се събират повече заедно, вместо пред екраните, докато се наслаждават на стилни покани, които правят всяко събитие специално.
          </p>
        </div>

        {/* Vision */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">visibility</span>
            <h2 className={styles.blockTitle}>Визия</h2>
          </div>
          <p className={styles.text}>
            Да предоставим възможността на всеки да създава красиви и интересни покани.
          </p>
        </div>

        {/* Values / Promise */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <span className="material-symbols-outlined">shield</span>
            <h2 className={styles.blockTitle}>Ценности</h2>
          </div>
          <p className={styles.text}>
            Стремим се към простота, красота и полезност. Вярваме, че със здрав труд всичко е възможно.
          </p>
        </div>
      </div>
    </div>
  );
}
