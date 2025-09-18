'use client';

import { useLogin } from '@/hooks/useLogin';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import { Heading } from '@/ui-components/Heading/Heading';
import { TextLink } from '@/ui-components/TextLink/TextLink';
import SideSlideshow from '@/ui-components/SideSlideshow/SideSlideshow';

import Image from 'next/image';
import Link from 'next/link';
import styles from './LoginForm.module.css';

import LogoLetters from '@/assets/logo_horizontal_letters.png';
import Logo from '@/assets/logo.png';
import Picnic from '@/assets/picnic.png';
import Birthday from '@/assets/birthday.png';
import Wedding from '@/assets/wedding.png';

export default function Login() {

  const {
    formData,
    formErrors,
    loading,
    success,
    handleChange,
    handleFocus,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
    fbReady,
  } = useLogin();

  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <div className={`container ${styles.login}`}>
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
              <Image
                src={Logo}
                width={44}
                height={34}
                alt="Logo"
                className={styles.logo}
              />
              <Heading marginBottom="1rem" as="h1" size="3xl" color="--color-dark-300" align="center">Добре дошли</Heading>
            </div>

            <div className={styles.socialLogin}>
              <Button onClick={handleGoogleLogin} width="100%" size="middle" variant="secondary">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  width={21}
                  height={21}
                  alt="Google Logo"
                  className={styles.sociallogo}
                />
                <p>Влез с Google</p>
              </Button>

              <div style={{ marginBottom: "1rem" }} />

              <Button disabled={!fbReady} width="100%" size="middle" onClick={handleFacebookLogin} variant="secondary">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg"
                  width={21}
                  height={21}
                  alt="Facebook Logo"
                  className={styles.sociallogo}
                />
                <p>Влез с Facebook</p>
              </Button>
            </div>

            <div className={styles.divider}>
              <p>или</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <Input
                id="email"
                name="email"
                type="email"
                label="Въведи имейл"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleFocus('email')}
                error={formErrors.email}
                required
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Въведи парола"
                value={formData.password}
                onChange={handleChange}
                onFocus={handleFocus('password')}
                error={formErrors.password}
                required
              />

              <Button width="100%" type="submit" variant="primary" disabled={loading}>
                {loading ? 'Влизам...' : 'Вход'}
              </Button>

              <div className={styles.buttonSecondaryGroup}>
                <p>Като продължите, вие се съгласявате с нашите <TextLink href="/privacy" color="accent">Условия</TextLink> и <TextLink href="/privacy" color="accent">Политика за поверителност</TextLink>.</p>
                <p>
                  Нямате акаунт? <TextLink href="/register" color="accent">Регистрирайте се</TextLink>.
                </p>
                <p>
                  Забравена парола? <TextLink href="/password-reset/request/" color="accent">Натиснете тук</TextLink>.
                </p>
              </div>

              {success && <p className={styles.successMessage}>Успешен вход!</p>}
            </form>
          </div>
        </div>
      </div>
      <div className={styles.side}>
        <SideSlideshow
          slides={[
            <Image
              key="bday"
              src={Picnic}
              alt="Birthday"
              fill
              style={{objectFit: 'cover'}}
            />,
            <Image
              key="bday"
              src={Birthday}
              alt="Birthday"
              fill
              style={{objectFit: 'cover'}}
            />,
            <Image
              key="bday"
              src={Wedding}
              alt="Birthday"
              fill
              style={{objectFit: 'cover'}}
            />
          ]}
        />
      </div>
    </div>
  );
}
