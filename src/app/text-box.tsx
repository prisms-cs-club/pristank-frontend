import { useState } from "react";
import styles from "./page.module.css";

export default function TextBox({ callback }: { callback: (text: string) => void }) {
    const [text, setText] = useState<string>("");
    return <div className={styles["text-box"]}>
        <input type="text" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={() => callback(text)}>submit</button>
    </div>
}