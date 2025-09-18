'use client';

import { useState } from 'react';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import styles from '../PasswordReset.module.css';

export default function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; apiError?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  function validate() {
    const errs: { email?: string } = {};
    if (!email.trim()) {
      errs.email = 'Моля, въведете имейл';
    }
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitted(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Линк за смяна на паролата беше изпратен на имейла ви.');
      } else {
        setErrors({ apiError: data.detail || 'Възникна грешка.' });
      }
    } catch (err) {
      console.error('Request error:', err);
      setErrors({ apiError: 'Възникна грешка. Моля, опитайте по-късно.' });
    }
  };

  return (
    <div className="container fullHeight">
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <h2 className={styles.heading}>Възстанови парола</h2>

        <Input
          id="email"
          name="email"
          type="email"
          label="Имейл"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" width="100%" disabled={isSubmitted}>
          {isSubmitted ? 'Изпратен' : 'Изпрати линк'}
        </Button>

        {message && <p className={`${styles.message} ${styles.success}`}>{message}</p>}
        {errors.apiError && <p className={`${styles.message} ${styles.error}`}>{errors.apiError}</p>}
      </form>
    </div>
  );
}
