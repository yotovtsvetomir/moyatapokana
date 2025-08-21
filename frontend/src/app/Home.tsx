"use client";

import styles from './home.module.css';
import { Button } from '@/ui-components/Button/Button';
import SocialAuth from '@/components/SocialAuth/SocialAuth';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const { user, loading } = useUser();


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container fullHeight">
      <div className={styles.page}>
        {user ? (
          <h1>Здравейте отново, {user.first_name} {user.last_name}!</h1>
        ) : (
          <h1>Здравейте! Моля влезте или се регистрирайте за да продължите.</h1>
        )}
      </div>
    </div>
  );
}
