import styles from '@/app/page.module.css';
import mapEditorStyles from '@/app/map-editor/map-editor.module.css';
import { MAP_EDITOR_SYMMETRIES, MAP_EDITOR_DEFAULT_HEIGHT, MAP_EDITOR_DEFAULT_WIDTH, MapEditor } from '@/map-editor';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { HP_COLOR, MAX_HP_RECOVER, MAX_MONEY_RECOVER, MONEY_COLOR } from '@/tile';
import Image from 'next/image';
import UpperTile from './tile/tile-upper.svg';
import LowerTile from './tile/tile-lower.svg';

/**
 * Save the map creation event corresponding to the map editor into a json file.
 * @param mapEditor map editor object
 */
function save(mapEditor: MapEditor) {
    const file = new Blob([JSON.stringify(mapEditor.getMapCrtEvent())], {type: "application/json"});
    const link = URL.createObjectURL(file);
    const a = document.getElementsByClassName(mapEditorStyles["save"])[0];
    a.setAttribute("href", link);
}

/**
 * Copy the map creation event corresponding to the map editor into the clipboard.
 * @param mapEditor map editor object
 */
function copyToClipbord(mapEditor: MapEditor) {
    const text = JSON.stringify(mapEditor.getMapCrtEvent());
    navigator.clipboard.writeText(text).then(() => {
        window.alert("copied to clipboard");
    });
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
    if(option == "hide help") {
        target.innerText = "show help";
        for(const element of document.getElementsByClassName("to-hide")) {
            (element as HTMLElement).style.display = "none";
        }
    } else {
        target.innerText = "hide help";
        for(const element of document.getElementsByClassName("to-hide")) {
            (element as HTMLElement).style.removeProperty("display");
        }
    }
}

export default function MapEditorScene({mapEditor}: {mapEditor: MapEditor}) {
    const [hpIncrease, setHpIncrease] = useState<number>();
    const [moneyIncrease, setMoneyIncrease] = useState<number>();
    useEffect(() => {
        // append canvas
        const canvas = mapEditor.app.view as HTMLCanvasElement;
        canvas.className = styles["game-canvas"];
        document.getElementById("root")?.appendChild(canvas);
        // append blocks to the 'blocks' panel
        const blocksPanel = document.getElementById("blocks")!;
        for(const [name, data] of mapEditor.elements) {
            const image = document.createElement("img");
            image.id = "block-" + name;
            image.src = "/resource/texture/" + mapEditor.imagePath.get(data.parts[0].img)!!;
            image.onclick = e => {
                // select the block
                document.getElementById("block-" + mapEditor.activateBlock)?.classList.remove(mapEditorStyles["activated"]);
                mapEditor.activateBlock = name;
                image.classList.add(mapEditorStyles["activated"]);
            }
            const abbr = document.createElement("abbr");
            abbr.title = name;
            abbr.appendChild(image);
            blocksPanel.appendChild(abbr);
        }
        blocksPanel.onclick = e => {
            // remove selection
            if(e.target == blocksPanel) {
                document.getElementById("block-" + mapEditor.activateBlock)?.classList.remove(mapEditorStyles["activated"]);
                mapEditor.activateBlock = undefined;
            }
        }
    }, [mapEditor]);
    useEffect(() => {
        // set canvas onclick event
        const canvas = mapEditor.app.view as HTMLCanvasElement;
        canvas.onmousedown = e => {
            mapEditor.canvasOnClick(canvas, e, hpIncrease, moneyIncrease);
        }
    }, [mapEditor, hpIncrease, moneyIncrease]);
    return (
        <div id="root">
            <div className={styles["left-panel"]}>
                {/* card: select width and height */}
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
                    <p className={mapEditorStyles["warn"] + " " + "to-hide"}>Changing width and height will refresh the map.</p>
                    <p className={mapEditorStyles["warn"] + " " + "to-hide"}>Please save or copy the map before resizing it.</p>
                </div>
                {/* card: blocks */}
                <div className={styles["card"]}>
                    <div className={mapEditorStyles["blocks"]} id="blocks">
                        <p className="to-hide">To remove selection, click on the empty area in this panel.</p>
                    </div>
                </div>
                {/* card: HP and money increase speed */}
                <div className={styles["card"]}>
                    <table><tbody>
                        {/* hp increase */}
                        <tr>
                            <td>
                                <input type="checkbox" id="enable-hp" onChange={e => {
                                    if(e.target.checked) {
                                        setHpIncrease(parseInt((document.getElementById("hp-increase") as HTMLInputElement).value));
                                    } else {
                                        setHpIncrease(undefined);
                                    }
                                }} />
                            </td>
                            <td>
                                <UpperTile style={{color: `rgba(${HP_COLOR[0]}, ${HP_COLOR[1]}, ${HP_COLOR[2]}, ${(hpIncrease ?? 0) / MAX_HP_RECOVER})`}}
                                    width="60" height="60" viewBox="0 0 100 100" />
                            </td>
                            <td><label htmlFor="enable-hp">HP increase</label></td>
                            <td>
                                <input type="range" id="hp-increase" min={0} max={MAX_HP_RECOVER} defaultValue={0} disabled={hpIncrease === undefined}
                                    onChange={e => {
                                        setHpIncrease(parseFloat(e.target.value));
                                    }} />
                            </td>
                        </tr>
                        {/* money increase */}
                        <tr>
                            <td>
                                <input type="checkbox" id="enable-money" onChange={e => {
                                    if(e.target.checked) {
                                        setMoneyIncrease(parseInt((document.getElementById("money-increase") as HTMLInputElement).value));
                                    } else {
                                        setMoneyIncrease(undefined);
                                    }
                                }} />
                            </td>
                            <td>
                                <LowerTile style={{color: `rgba(${MONEY_COLOR[0]}, ${MONEY_COLOR[1]}, ${MONEY_COLOR[2]}, ${(moneyIncrease ?? 0) / MAX_MONEY_RECOVER})`}}
                                    width="60" height="60" viewBox="0 0 100 100" />
                            </td>
                            <td><label htmlFor="enable-money">Money increase</label></td>
                            <td>
                                <input type="range" id="money-increase" min={0} max={MAX_MONEY_RECOVER} defaultValue={0} disabled={moneyIncrease === undefined}
                                    onChange={e => {
                                        setMoneyIncrease(parseFloat(e.target.value));
                                    }} />
                            </td>
                        </tr>
                    </tbody></table>
                </div>
                {/* card: symmetry */}
                <div className={styles["card"]}>
                    <p>Symmetry</p>
                    <select onChange={e => {mapEditor.symmetry = e.target.value;}}>
                        {
                            MAP_EDITOR_SYMMETRIES.map((symmetry) => <option key={symmetry} value={symmetry}>{symmetry}</option>)
                        }
                    </select>
                </div>
                <div className={styles["card"]} style={{display: "flex", flexDirection: "column"}}>
                    <a className={mapEditorStyles["save"]} onClick={() => save(mapEditor)} download="map.json">save as json</a>
                    <a className={mapEditorStyles["save"]} onClick={() => copyToClipbord(mapEditor)}>copy to clipboard</a>
                </div>
            </div>
            <div className={styles["right-panel"]}>
                <div className={styles["card"]}>
                    <button onClick={e => toggleHide(e)}>hide help</button>
                </div>
                <div className={styles["card"] + " " + "to-hide"}>
                    <p>Select a type of block in the second panel and you will see a blue border indicating it being selected. Left click to place the block. Press <code>ctrl</code> or <code>shift</code> and left click to remove the block.</p>
                    <p>Select a symmetry to automatically place or remove another block symmetric to the position you choosed.</p>
                </div>
            </div>
        </div>
    );
}