'use client';

import styles from './page.module.css'
import { useLayoutEffect } from 'react'
import launch from './launch';

export default function Home() {
  useLayoutEffect(() => {
    launch(document.querySelector("main")!, styles["game-canvas"])
  });
  return (
    <main className={styles["game-container"]}>
    </main>
  )
}
