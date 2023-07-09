'use client';

import { useContext } from 'react';
import styles from './page.module.css';
import { ErrorContext } from './game-scene';

export default function ErrorPanel() {
    const error = useContext(ErrorContext);
    return (
        <div className={styles["center-screen"] + " " + styles["error-panel"]}>
            <p style={{textAlign: 'center'}}>ERROR</p>
            {
                error?.map((message, index) => <p key={index}>{message}</p>)
            }
        </div>
    )
}