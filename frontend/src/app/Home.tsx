"use client";

import { Template } from '@/shared/types';
import styles from './home.module.css';

import Intro from '@/components/Intro/Intro';
import EasyShare from "@/components/EasyShare/EasyShare";
import GuestTracking from "@/components/GuestTracking/GuestTracking";
import ChooseGame from "@/components/ChooseGame/ChooseGame";
import ChooseSlideshow from "@/components/ChooseSlideshow/ChooseSlideshow";
import CTA from '@/components/CTA/cta';
import CTAPricing from '@/components/CTAPricing/ctapricing';

interface HomeProps {
  templates: Template[];
}

export default function Home({ templates }: HomeProps) {
  return (
    <div className={styles.Home}>
      <Intro templates={templates} />
      <EasyShare />
      <GuestTracking />
      <CTA />
      <ChooseSlideshow />
      <ChooseGame />
      <CTAPricing />
    </div>
  );
}
