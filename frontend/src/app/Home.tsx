"use client";

import Intro from '@/components/Intro/Intro';
import { Template } from '@/shared/types';
import styles from './home.module.css';

interface HomeProps {
  templates: Template[];
}

export default function Home({ templates }: HomeProps) {
  return (
    <div className={styles.Home}>
      <Intro templates={templates} />
    </div>
  );
}
