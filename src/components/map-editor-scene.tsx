import styles from '@/app/page.module.css';
import mapEditorStyles from '@/app/map-editor/map-editor.module.css';
import { MAP_EDITOR_DEFAULT_HEIGHT, MAP_EDITOR_DEFAULT_WIDTH, MapEditor } from '@/map-editor';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

function save(mapEditor: MapEditor) {
    const file = new Blob([JSON.stringify(mapEditor.getMapCrtEvent())], {type: "application/json"});
    const link = URL.createObjectURL(file);
    const a = document.getElementsByClassName(mapEditorStyles["save"])[0];
    a.setAttribute("href", link);
    a.setAttribute("download", "map.json");
}

function inputWithMinMax(e: ChangeEvent<HTMLInputElement>) {
    let value = (e.target.value == "")? 0: parseInt(e.target.value);
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    if(value < min) {
        value = min;
        e.target.style.color = "red";
        e.target.value = value.toString();
    } else if(value > max) {
        value = max;
        e.target.style.color = "red";
        e.target.value = value.toString();
    } else {
        e.target.style.removeProperty("color");
    }
    return value;
}

export default function MapEditorScene({mapEditor}: {mapEditor: MapEditor}) {
    useEffect(() => {
        // append canvas
        const canvas = mapEditor.app.view as HTMLCanvasElement;
        canvas.className = styles["game-canvas"];
        canvas.onmousedown = e => {
            mapEditor.canvasOnClick(canvas, e);
        }
        document.getElementById("root")?.appendChild(canvas);
        // append blocks
        const blocks = document.getElementById("blocks")!;
        for(const [name, data] of mapEditor.elements) {
            const image = document.createElement("img");
            image.id = "block-" + name;
            image.src = "/resource/texture/" + mapEditor.imagePath.get(data.parts[0].img)!!;
            image.onclick = e => {
                document.getElementById("block-" + mapEditor.activateBlock)?.classList.remove(mapEditorStyles["activated"]);
                mapEditor.activateBlock = name;
                image.classList.add(mapEditorStyles["activated"]);
            }
            const abbr = document.createElement("abbr");
            // TODO: abbr
            abbr.appendChild(image);
            blocks.appendChild(abbr);
        }
    });
    return (
        <div id="root">
            <div className={styles["left-panel"]}>
                <div className={styles["card"]}>
                    <div>
                        <label>width: </label>
                        <input type="number" id="width" min={3} max={64} defaultValue={MAP_EDITOR_DEFAULT_WIDTH} onChange={e => {
                            const value = inputWithMinMax(e);
                            mapEditor.setWidth(value);
                        }} />
                    </div>
                    <div>
                        <label>height: </label>
                        <input type="number" id="height" min={3} max={64} defaultValue={MAP_EDITOR_DEFAULT_HEIGHT} onChange={e => {
                            const value = inputWithMinMax(e);
                            mapEditor.setHeight(value);
                        }} />
                    </div>
                </div>
                <div className={styles["card"]}>
                    <div className={mapEditorStyles["blocks"]} id="blocks"></div>
                </div>
                <div className={styles["card"]}>
                    <a className={mapEditorStyles["save"]} onClick={() => save(mapEditor)}>save</a>
                </div>
            </div>
        </div>
    );
}