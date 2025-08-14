'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import styles from '../PasswordReset.module.css';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; apiError?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  function validate() {
    const errs: { newPassword?: string; confirmPassword?: string } = {};
    if (!newPassword) {
      errs.newPassword = 'Моля, въведете нова парола';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Моля, потвърдете паролата';
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = 'Паролите не съвпадат';
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

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/password-reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Паролата е сменена успешно.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        let errorMessage = 'Невалиден токен или потребител.';

        if (Array.isArray(data)) {
          errorMessage = data.map((err) => err.msg).join(', ');
        } else if (data.detail) {
          errorMessage = data.detail;
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setErrors({ apiError: 'Възникна грешка. Моля, опитайте по-късно.' });
    }
  };

  return (
    <div className="container fullHeight">
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <h2 className={styles.heading}>Смени парола</h2>

        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          label="Нова парола"
          value={newPassword}
          error={errors.newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Потвърди паролата"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" width="100%" disabled={isSubmitting}>
          {isSubmitting ? 'Изпратени' : 'Смени паролата'}
        </Button>

        {message && <p className={`${styles.message} ${styles.success}`}>{message}</p>}
        {errors.apiError && <p className={`${styles.message} ${styles.error}`}>{errors.apiError}</p>}
      </form>
    </div>
  );
}
