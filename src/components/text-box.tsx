import { useState } from "react";
import styles from "@/app/page.module.css";

export default function TextBox({ label, placeholder, onsubmit }: { label: string, placeholder: string, onsubmit: (text: string) => void }) {
    const [text, setText] = useState<string>("");
    return <div id="text-box" className={styles["text-box"]}>
        <p>{label}</p>
        <input type="text"
            value={text}
            placeholder={placeholder}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
                if(e.key == "Enter") {
                    onsubmit(text);
                    setText("");
                }
            }} />
    </div>
}