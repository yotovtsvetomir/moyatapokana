"use client";

import type { components } from '@/shared/types';
import styles from './home.module.css';

import Intro from '@/components/Intro/Intro';
import EasyShare from "@/components/EasyShare/EasyShare";
import GuestTracking from "@/components/GuestTracking/GuestTracking";
import ChooseGame from "@/components/ChooseGame/ChooseGame";
import ChooseSlideshow from "@/components/ChooseSlideshow/ChooseSlideshow";
import CTA from '@/components/CTA/cta';
import BlogPostsClient from '@/app/%D0%B1%D0%BB%D0%BE%D0%B3%D0%BF%D0%BE%D1%81%D1%82%D0%BE%D0%B2%D0%B5/BlogPostsClient'

type TemplateRead = components['schemas']['TemplateRead'];
type BlogPostRead = components['schemas']['BlogPostOut'];

interface HomeProps {
  templates: TemplateRead[];
  blogposts: BlogPostRead[];
}

export default function Home({ templates, blogposts }: HomeProps) {
  return (
    <div className={styles.Home}>
      <Intro templates={templates} />
      <EasyShare />
      <GuestTracking />
      <CTA />
      <ChooseSlideshow />
      <ChooseGame />
      <BlogPostsClient home={true} posts={blogposts} />
    </div>
  );
}
