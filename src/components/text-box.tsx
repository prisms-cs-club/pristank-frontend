import { useState } from "react";
import styles from "@/app/page.module.css";

type TextBoxParams = {
    type: "text" | "number",
    label?: string,
    placeholder: string,
    onSubmit: (text: string) => void,
};

export default function TextBox({ type, label, placeholder, onSubmit }: TextBoxParams) {
    const [text, setText] = useState<string>("");
    return <div className={styles["text-box"]}>
        {(label != undefined)? <p>{label}</p>: null}
        <input type={type}
            value={text}
            placeholder={placeholder}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
                if(e.key == "Enter") {
                    onSubmit(text);
                    setText("");
                }
            }} />
    </div>
}