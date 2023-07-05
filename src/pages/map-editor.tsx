import { useState } from "react";
import styles from "../app/page.module.css";

export default function MapEditor() {
    // TODO: not completed
    const [width, setWidth] = useState<number>(10);
    const [height, setHeight] = useState<number>(10);
    return (
        <div>
            <div style={{display: "flex", flexDirection: "column", maxWidth: "30%"}}>
                <div className={styles["card"]}>
                    <div>
                        <label>width: </label>
                        <input type="number" id="width" value={width} onChange={e => setWidth(parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label>height: </label>
                        <input type="number" id="height" value={height} onChange={e => setHeight(parseInt(e.target.value))} />
                    </div>
                </div>
            </div>
            <canvas className={styles["game-canvas"]}></canvas>
        </div>
    )
}