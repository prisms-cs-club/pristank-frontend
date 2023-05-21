'use client';

import Image from 'next/image'
import styles from './page.module.css'
import { useLayoutEffect } from 'react'
import launch from './launch';

export default function Home() {
  useLayoutEffect(() => {
    launch(document.querySelector('body')!)
  });
  return (
    <main className={styles.main}>
    </main>
  )
}
