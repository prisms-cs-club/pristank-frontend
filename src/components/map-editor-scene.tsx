import styles from '@/app/page.module.css';
import { MapEditor } from '@/map-editor';
import { useEffect, useRef, useState } from 'react';

export default function MapEditorScene({mapEditor}: {mapEditor: MapEditor}) {
    useEffect(() => {
        const canvas = mapEditor.app.view as HTMLCanvasElement;
        canvas.className = styles["game-canvas"];
        document.getElementById("root")?.appendChild(canvas);
    });
    return (
        <div id="root">
            <div className={styles["left-panel"]}>
                <div className={styles["card"]}>
                    <div>
                        <label>width: </label>
                        <input type="number" id="width" min={1} max={64} value={mapEditor.width} onChange={e => {
                            mapEditor.setWidth(parseInt(e.target.value));
                        }} />
                    </div>
                    <div>
                        <label>height: </label>
                        <input type="number" id="height" min={1} max={64} value={mapEditor.width} onChange={e => {
                            mapEditor.setHeight(parseInt(e.target.value));
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}