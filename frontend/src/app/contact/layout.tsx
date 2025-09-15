// app/contact/layout.tsx
import { Metadata } from "next";
import Script from "next/script";
import styles from './Contact.module.css';

const CONTACT_URL = `${process.env.NEXT_PUBLIC_CLIENT_URL}/contact`;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Свържете се с нас - Moyatapokana.bg";
  const description =
    "Свържете се с нас за въпроси или запитвания. Имейл, офис адрес и работно време на Moyatapokana.bg.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: CONTACT_URL,
      siteName: "Moyatapokana.bg",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: CONTACT_URL,
    },
  };
}

interface Props {
  children?: React.ReactNode;
}

export default function ContactLayout({ children }: Props) {
  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Moyatapokana.bg",
    url: process.env.NEXT_PUBLIC_CLIENT_URL,
    logo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@moyatapokana.bg",
      contactType: "Customer Support",
      areaServed: "BG",
      availableLanguage: "BG",
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Уста Колю Фичето 25A",
      addressLocality: "Варна",
      postalCode: "9010",
      addressCountry: "BG",
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <Script
        id="jsonld-contact"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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

          {/* Info Block */}
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

          {children}
        </div>
      </div>
    </>
  );
}
