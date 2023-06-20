'use client';

import styles from './page.module.css';

export default function ErrorPanel({ messages }: { messages: string[] }) {
    const ret = [];
    for(const message of messages) {
        ret.push(<p>{message}</p>)
    }
    return (
        <div className={styles["center-screen"] + " " + styles["error-panel"]}>
            <p style={{textAlign: 'center'}}>ERROR</p>
            {ret}
        </div>
    )
}