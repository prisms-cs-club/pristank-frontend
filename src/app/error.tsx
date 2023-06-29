'use client';

import styles from './page.module.css';

export default function ErrorPanel({ messages }: { messages: string[] }) {
    return (
        <div className={styles["center-screen"] + " " + styles["error-panel"]}>
            <p style={{textAlign: 'center'}}>ERROR</p>
            {
                messages.map((message, index) => <p key={index}>{message}</p>)
            }
        </div>
    )
}