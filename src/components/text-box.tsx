import { useState } from "react";
import styles from "@/app/page.module.css";

export default function TextBox({ type, label, placeholder, onsubmit }: { type: "text" | "number", label: string, placeholder: string, onsubmit: (text: string) => void }) {
    const [text, setText] = useState<string>("");
    return <div className={styles["text-box"]}>
        <p>{label}</p>
        <input type={type}
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