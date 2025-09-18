import Script from "next/script";
import styles from './About.module.css';

export default function AboutLayout({ children }: { children?: React.ReactNode }) {
  // Optional structured data for About / Organization
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Moyatapokana.bg",
    url: process.env.NEXT_PUBLIC_CLIENT_URL,
    logo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/logo.png`,
    description: "Нашата цел е да направим организирането на събития лесно, стилно и незабравимо.",
    sameAs: [
      "https://www.facebook.com/moyatapokana",
      "https://www.instagram.com/moyatapokana"
    ]
  };

  return (
    <>
      <head>
        <title>За нас - Moyatapokana.bg</title>
        <meta
          name="description"
          content="Научете повече за Moyatapokana.bg – нашата мисия, визия и ценности за създаване на красиви и стилни покани."
        />

        {/* Open Graph */}
        <meta property="og:title" content="За нас - Moyatapokana.bg" />
        <meta property="og:description" content="Научете повече за Moyatapokana.bg – нашата мисия, визия и ценности за създаване на красиви и стилни покани." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_CLIENT_URL}/about`} />
        <meta property="og:site_name" content="Moyatapokana.bg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="За нас - Moyatapokana.bg" />
        <meta name="twitter:description" content="Научете повече за Moyatapokana.bg – нашата мисия, визия и ценности за създаване на красиви и стилни покани." />
      </head>

      {/* JSON-LD */}
      <Script
        id="jsonld-about"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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

          {children}
        </div>
      </div>
    </>
  );
}
