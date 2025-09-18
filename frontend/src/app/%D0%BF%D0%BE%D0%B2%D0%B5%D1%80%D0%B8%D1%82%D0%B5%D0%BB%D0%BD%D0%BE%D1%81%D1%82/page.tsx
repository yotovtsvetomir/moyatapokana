// app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="fullHeight" style={{ background: "var(--color-neutral-400)", paddingBottom: '2rem' }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "2.5rem 2rem",
          background: "var(--color-neutral-500)",
          borderRadius: 18,
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-dark-200)",
          position: "relative",
        }}
      >
        {/* Bulgarian Section */}
        <h1
          style={{
            fontSize: "var(--font-3xl)",
            marginBottom: "1.1rem",
            color: "var(--color-highlight-1)",
          }}
        >
          Политика за поверителност
        </h1>
        <p>Последна актуализация: 11 юни 2025 г.</p>

        {/** Section h2 styling reused inline */}
        {[
          {
            title: "1. Въведение",
            content:
              "Този уебсайт (“Moyata Pokana”, “ние”, “нас”) се ангажира да защитава поверителността на своите потребители. Тази политика за поверителност обяснява как събираме, използваме и защитаваме вашата информация.",
          },
          {
            title: "2. Каква информация събираме?",
            list: [
              "Имейл адрес",
              "Име и фамилия (ако е предоставено от Facebook/Google)",
              "Други данни, предоставени доброволно при използване на нашата услуга",
            ],
          },
          {
            title: "3. Как използваме вашата информация?",
            list: [
              "За да ви регистрираме и идентифицираме във “Moyata Pokana”",
              "За да ви изпращаме важни съобщения, свързани с вашата регистрация или услуги",
              "За да подобрим услугата и потребителското изживяване",
            ],
          },
          {
            title: "4. Споделяне на информация",
            content:
              "Вашите лични данни не се споделят с трети страни, освен ако това не се изисква от закона или при нужда за предоставяне на услугата.",
          },
          {
            title: "5. Защита на данните",
            content:
              "Вземаме разумни мерки за защита на вашата информация. Въпреки това, не можем да гарантираме абсолютна сигурност на данните, предавани по интернет.",
          },
          {
            title: "6. Вашите права",
            content:
              <>
                Можете по всяко време да поискате достъп до, корекция или изтриване на вашите лични данни, като се свържете с нас на:{" "}
                <a
                  href="mailto:support@moyatapokana.bg"
                  style={{ color: "var(--color-highlight-1)", textDecoration: "underline" }}
                >
                  support@moyatapokana.bg
                </a>
              </>,
          },
          {
            title: "7. Промени в политиката",
            content:
              "Запазваме си правото да актуализираме тази политика за поверителност. Всички промени ще бъдат публикувани на тази страница.",
          },
        ].map((section, idx) => (
          <div key={idx}>
            <h2
              style={{
                fontSize: "var(--font-lg)",
                marginTop: "2rem",
                marginBottom: "0.7rem",
                color: "var(--color-highlight-1)",
                fontWeight: "var(--font-weight-semi)",
              }}
            >
              {section.title}
            </h2>
            {section.list ? (
              <ul style={{ paddingLeft: "1.3rem", marginBottom: "1rem", lineHeight: 1.7 }}>
                {section.list.map((item, i) => (
                  <li key={i} style={{ fontSize: "var(--font-md)", marginBottom: "0.45rem" }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: "var(--font-md)", lineHeight: 1.7 }}>{section.content}</p>
            )}
          </div>
        ))}

        <hr style={{ borderTop: "1px solid var(--color-dark-300)", margin: "2.5rem 0" }} />

        {/* English Section */}
        <h1
          style={{
            fontSize: "var(--font-3xl)",
            marginBottom: "1.1rem",
            color: "var(--color-highlight-1)",
          }}
        >
          Privacy Policy (English)
        </h1>
        <p>Last updated: June 11, 2025</p>

        {[
          {
            title: "1. Introduction",
            content:
              "This website (“Moyata Pokana”, “we”, “us”) is committed to protecting your privacy. This privacy policy explains how we collect, use, and safeguard your information.",
          },
          {
            title: "2. What information do we collect?",
            list: ["Email address", "First and last name (if provided by Facebook/Google)", "Other data you voluntarily provide while using our service"],
          },
          {
            title: "3. How do we use your information?",
            list: [
              "To register and identify you in “Moyata Pokana”",
              "To send you important messages related to your registration or our services",
              "To improve our service and user experience",
            ],
          },
          {
            title: "4. Information sharing",
            content: "Your personal data is not shared with third parties unless required by law or necessary to provide our service.",
          },
          {
            title: "5. Data protection",
            content: "We take reasonable steps to protect your information. However, we cannot guarantee absolute security of data transmitted over the Internet.",
          },
          {
            title: "6. Your rights",
            content:
              <>
                You may at any time request access to, correction, or deletion of your personal data by contacting us at:{" "}
                <a
                  href="mailto:support@moyatapokana.bg"
                  style={{ color: "var(--color-highlight-1)", textDecoration: "underline" }}
                >
                  support@moyatapokana.bg
                </a>
              </>,
          },
          {
            title: "7. Changes to this policy",
            content: "We reserve the right to update this privacy policy. Any changes will be posted on this page.",
          },
        ].map((section, idx) => (
          <div key={idx}>
            <h2
              style={{
                fontSize: "var(--font-lg)",
                marginTop: "2rem",
                marginBottom: "0.7rem",
                color: "var(--color-highlight-1)",
                fontWeight: "var(--font-weight-semi)",
              }}
            >
              {section.title}
            </h2>
            {section.list ? (
              <ul style={{ paddingLeft: "1.3rem", marginBottom: "1rem", lineHeight: 1.7 }}>
                {section.list.map((item, i) => (
                  <li key={i} style={{ fontSize: "var(--font-md)", marginBottom: "0.45rem" }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: "var(--font-md)", lineHeight: 1.7 }}>{section.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
