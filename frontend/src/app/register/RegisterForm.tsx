'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRegister } from '@/hooks/useRegister';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import { Heading } from '@/ui-components/Heading/Heading';
import { TextLink } from '@/ui-components/TextLink/TextLink';
import SideSlideshow from '@/ui-components/SideSlideshow/SideSlideshow';

import styles from './RegisterForm.module.css';

import LogoLetters from '@/assets/logo_horizontal_letters.png';
import Logo from '@/assets/logo.png';
import Picnic from '@/assets/picnic.png';
import Birthday from '@/assets/birthday.png';
import Wedding from '@/assets/wedding.png';

export default function RegisterPage() {
  const {
    values,
    confirmPassword,
    errors,
    loading,
    success,
    handleChange,
    handleConfirmChange,
    handleFocus,
    handleSubmit,
    handleGoogleRegister,
    handleFacebookRegister,
    fbReady,
  } = useRegister();

  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <div className={`container ${styles.register}`}>
          <div className={styles.head}>
            <Link href="/">
              <Image
                src={LogoLetters}
                width={150}
                height={15}
                alt="Logo"
                className={styles.logoLetters}
              />
            </Link>
          </div>

          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <Image src={Logo} width={44} height={34} alt="Logo" className={styles.logo} />
              <Heading
                marginBottom="1rem"
                as="h1"
                size="3xl"
                color="--color-dark-300"
                align="center"
              >
                Добре дошли
              </Heading>
            </div>

            <div className={styles.socialLogin}>
              <Button onClick={handleGoogleRegister} width="100%" size="middle" variant="secondary">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  width={21}
                  height={21}
                  alt="Google Logo"
                  className={styles.sociallogo}
                />
                <p>Регистрация с Google</p>
              </Button>

              <Button
                disabled={!fbReady}
                onClick={handleFacebookRegister}
                width="100%"
                size="middle"
                variant="secondary"
              >
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg"
                  width={21}
                  height={21}
                  alt="Facebook Logo"
                  className={styles.sociallogo}
                />
                <p>Регистрация с Facebook</p>
              </Button>
            </div>

            <div className={styles.divider}>
              <p>или</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                label="Име"
                value={values.first_name}
                onChange={handleChange}
                onFocus={handleFocus('first_name')}
                error={errors.first_name}
                required
              />

              <Input
                id="last_name"
                name="last_name"
                type="text"
                label="Фамилия"
                value={values.last_name}
                onChange={handleChange}
                onFocus={handleFocus('last_name')}
                error={errors.last_name}
                required
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Имейл"
                value={values.email}
                onChange={handleChange}
                onFocus={handleFocus('email')}
                error={errors.email}
                required
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Парола"
                value={values.password}
                onChange={handleChange}
                onFocus={handleFocus('password')}
                error={errors.password}
                required
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Повтори паролата"
                value={confirmPassword}
                onChange={handleConfirmChange}
                onFocus={handleFocus('confirmPassword')}
                error={errors.confirmPassword}
                required
              />

              <Button width="100%" type="submit" variant="primary" disabled={loading}>
                {loading ? 'Регистрирам...' : 'Регистрация'}
              </Button>

              <div className={styles.buttonSecondaryGroup}>
                <p>
                  Продължавайки, вие се съгласявате с нашите{' '}
                  <TextLink href="/terms">Условия</TextLink> и{' '}
                  <TextLink href="/privacy">Политика за поверителност</TextLink>.
                </p>
                <p>
                  Вече имате акаунт? <TextLink href="/login">Влезте от тук</TextLink>.
                </p>
              </div>

              {errors.apiError && <p className={styles.errorMessage}>{errors.apiError}</p>}
              {success && <p className={styles.successMessage}>Успешна регистрация!</p>}
            </form>
          </div>
        </div>
      </div>

      <div className={styles.side}>
        <SideSlideshow
          slides={[
            <Image key="picnic" src={Picnic} alt="Picnic" fill style={{ objectFit: 'cover' }} />,
            <Image key="birthday" src={Birthday} alt="Birthday" fill style={{ objectFit: 'cover' }} />,
            <Image key="wedding" src={Wedding} alt="Wedding" fill style={{ objectFit: 'cover' }} />,
          ]}
        />
      </div>
    </div>
  );
}
