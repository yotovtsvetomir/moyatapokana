"use client";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="container">
        <h1>404</h1>
        <h2>Страницата не е намерена</h2>
        <p>Съжаляваме! Страницата, която търсите, не съществува или е преместена.</p>
      </div>

      <style jsx>{`
        .not-found {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--color-neutral-500);
          color: var(--color-dark-100);
          font-family: var(--font-sans);
          text-align: center;
          padding: 2rem;
        }

        .container h1 {
          font-size: var(--font-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-highlight-1);
          margin-bottom: 1rem;
        }

        .container h2 {
          font-size: var(--font-xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: 1rem;
        }

        .container p {
          font-size: var(--font-md);
          color: var(--color-dark-400);
          margin-bottom: 2rem;
        }

        .home-link {
          display: inline-block;
          background-color: var(--color-highlight-1);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: var(--font-weight-semi);
          text-decoration: none;
          transition: background-color 0.3s;
        }

        .home-link:hover {
          background-color: var(--color-highlight-2);
        }
      `}</style>
    </main>
  );
}
