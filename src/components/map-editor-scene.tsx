import styles from '@/app/page.module.css';
import mapEditorStyles from '@/app/map-editor/map-editor.module.css';
import { MAP_EDITOR_SYMMETRIES, MAP_EDITOR_DEFAULT_HEIGHT, MAP_EDITOR_DEFAULT_WIDTH, MapEditor } from '@/map-editor';
import React, { ChangeEvent, useEffect } from 'react';

/**
 * Save the map creation event corresponding to the map editor into a json file.
 * @param mapEditor map editor object
 */
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

function toggleHide(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    const target = e.target as HTMLButtonElement;
    const option = target.innerText;
    if(option == "hide") {
        target.innerText = "show";
        for(const element of document.getElementsByClassName("to-hide")) {
            (element as HTMLElement).style.display = "none";
        }
    } else {
        target.innerText = "hide";
        for(const element of document.getElementsByClassName("to-hide")) {
            (element as HTMLElement).style.removeProperty("display");
        }
    }
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
            abbr.title = name;
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
                    <p>Symmetry</p>
                    <select onChange={e => {mapEditor.symmetry = e.target.value;}}>
                        {
                            MAP_EDITOR_SYMMETRIES.map((symmetry) => <option key={symmetry} value={symmetry}>{symmetry}</option>)
                        }
                    </select>
                </div>
                <div className={styles["card"]}>
                    <a className={mapEditorStyles["save"]} onClick={() => save(mapEditor)}>save as json</a>
                </div>
            </div>
            <div className={styles["right-panel"]}>
                <div className={styles["card"]}>
                    <button onClick={e => toggleHide(e)}>hide</button>
                </div>
                <div className={styles["card"] + " " + "to-hide"}>
                    <p>Select a block in the second panel. Left click to place the block. Press <code>ctrl</code> or <code>shift</code> and left click to remove the block.</p>
                    <p>Select a symmetry to automatically place or remove another block symmetric to the position you choosed.</p>
                </div>
            </div>
        </div>
    );
}