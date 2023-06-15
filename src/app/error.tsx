'use client';

import styles from './page.module.css';

export default function ErrorPanel({ message }: { message: string }) {
    return (
        <div className={styles["center-screen"] + " " + styles["error-panel"]}>
            <p>Error:</p>
            <p>{message}</p>
        </div>
    )
}