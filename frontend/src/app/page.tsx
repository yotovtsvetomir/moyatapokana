import styles from './home.module.css';
import { Button } from '@/ui-components/Button/Button';

export default function Home() {
  return (
    <div className="container fullHeight">
      <div className={styles.page}>
        <h1>Здравейте! Моля влезте или се регистрирайте за да продължите.</h1>

        <div className={styles.buttons}>
          <Button variant="primary" size="middle" href="/login">
            Влез
          </Button>
          <Button variant="secondary" size="middle" href="/register">
            Регистрация
          </Button>
        </div>
      </div>
    </div>
  );
}
