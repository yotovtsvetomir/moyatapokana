// app/data-deletion/page.tsx
export default function DataDeletionPage() {
  return (
    <div className="fullHeight">
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
          background: "var(--color-neutral-500)",
          borderRadius: "16px",
          boxShadow: "0 4px 28px rgba(0,0,0,0.07)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-dark-200)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-3xl)",
            marginBottom: "1.2rem",
            color: "var(--color-highlight-1)",
          }}
        >
          Заявка за изтриване на данни / изтриване на акаунт
        </h1>
        <p style={{ fontSize: "var(--font-lgl)", marginBottom: "1.4rem" }}>
          Ако желаете да изтриете своя акаунт и всички свързани с него лични данни
          от нашата услуга, моля изпратете имейл заявка на:
        </p>
        <p
          style={{
            fontWeight: "var(--font-weight-bold)",
            fontSize: "var(--font-lgl)",
            marginBottom: "2rem",
          }}
        >
          <a
            href="mailto:support@moyatapokana.bg"
            style={{
              color: "var(--color-highlight-1)",
              textDecoration: "underline",
            }}
          >
            support@moyatapokana.bg
          </a>
        </p>
        <p style={{ fontSize: "var(--font-md)", color: "var(--color-dark-400)" }}>
          Моля, посочете имейл адреса, с който сте се регистрирали, и ясно
          напишете, че желаете вашият акаунт и всички данни да бъдат изтрити.
          <br />
          <br />
          Ще обработим вашата заявка възможно най-бързо и ще ви потвърдим по
          имейл, когато данните ви бъдат изтрити.
        </p>

        <br />
        <hr style={{ borderTop: "1px solid var(--color-dark-300)" }} />
        <br />

        <h1
          style={{
            fontSize: "var(--font-3xl)",
            marginBottom: "1.2rem",
            color: "var(--color-highlight-1)",
          }}
        >
          Request Data Deletion / Account Removal
        </h1>
        <p style={{ fontSize: "var(--font-lgl)", marginBottom: "1.4rem" }}>
          If you would like to delete your account and all associated personal
          data from our service, please send an email request to:
        </p>
        <p
          style={{
            fontWeight: "var(--font-weight-bold)",
            fontSize: "var(--font-lgl)",
            marginBottom: "2rem",
          }}
        >
          <a
            href="mailto:support@moyatapokana.bg"
            style={{
              color: "var(--color-highlight-1)",
              textDecoration: "underline",
            }}
          >
            support@moyatapokana.bg
          </a>
        </p>
        <p style={{ fontSize: "var(--font-md)", color: "var(--color-dark-400)" }}>
          Please include the email address you registered with, and clearly state
          that you wish to have your account and data deleted.
          <br />
          <br />
          We will process your request as soon as possible and confirm by email
          once your data has been deleted.
        </p>
      </div>
    </div>
  );
}
