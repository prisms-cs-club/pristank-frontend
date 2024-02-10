import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { ElementData, constructInnerContainer } from "./element";
import { EventEntry, MapCreateEvent } from "./event";
import { Tile } from "./tile";
import { Task, Tasker } from "./utils/tasker";
import config from "@/config.json";
import * as PIXI from "pixi.js";

/// Tasks before starting the map editor ///
const loadBlockData: Task<Map<string, ElementData>> = {
    prerequisite: [],
    callback: async () => {
        const data = await fetch(config.path.elementData).then(data => data.json()) as { [key: string]: ElementData };
        for(const [_, entry] of Object.entries(data)) {
            // fill out the default values
            for(const part of entry.parts) {
                part.xOffset ??= 0;
                part.yOffset ??= 0;
                part.width ??= 1;
                part.height ??= 1;
                part.bgColor ??= false;
            }
        }
        return new Map(Object.entries(data).filter((value) => { return value[1].group == "block" }));
    }
}

const loadTextures: Task<[Map<string, string>, Map<string, PIXI.Texture>]> = {
    prerequisite: [],
    callback: async () => {
        const textures = new Map<string, PIXI.Texture>();
        const textureNames = Object.entries(await (await fetch(config.path.texture)).json() as { [key: string]: string });
        for(const [name, file] of textureNames) {
            textures.set(name, PIXI.Texture.from(`/resource/texture/${file}`));
        }
        return [new Map(textureNames), textures];
    }
}

const init: Task<MapEditor> = {
    prerequisite: ["load block data", "load textures"],
    callback: async (blockData: Map<string, ElementData>, [imagePath, textures]: [Map<string, string>, Map<string, PIXI.Texture>]) => {
        return new MapEditor(blockData, imagePath, textures);
    }
};

// the tasker for loading the map editor
export const loadMapEditor = new Tasker({
    "load block data": loadBlockData,
    "load textures": loadTextures,
    "initialize": init,
}, "initialize");

/// Map Editor ///

export const MAP_EDITOR_DEFAULT_WIDTH: number = 10;
export const MAP_EDITOR_DEFAULT_HEIGHT: number = 10;

// List of all symmetries in the editor
export const MAP_EDITOR_SYMMETRIES = ["none", "horizontal",  "vertical", "rotational"];
export type EditorSymmetry = typeof MAP_EDITOR_SYMMETRIES[number];

export class MapEditor {
    elements: Map<string, ElementData>;
    imagePath: Map<string, string>;       // path of each part of the element
    textures: Map<string, PIXI.Texture>;
    app: PIXI.Application;
    width: number = MAP_EDITOR_DEFAULT_WIDTH;
    height: number = MAP_EDITOR_DEFAULT_HEIGHT;
    unitPixel: number = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
    blocks!: string[][];                           // Serial names of each block. `blocks[j][i]` is the block on jth row and ith column.
    tiles!: Tile[][];                              // Tile properties of each block. Same format as `blocks`.
    blockImgs!: (PIXI.Container | undefined)[][];  // Images of each block on the canvas.
    
    // the following fields are modifiable by the UI
    activateBlock: string | undefined = undefined;
    symmetry: EditorSymmetry = "none";
    
    constructor(elements: Map<string, ElementData>, imagePath: Map<string, string>, textures: Map<string, PIXI.Texture>) {
        this.elements = elements;
        this.imagePath = imagePath;
        this.textures = textures;
        this.app = new PIXI.Application({
            width: this.unitPixel * this.width, height: this.unitPixel * this.height
        });
        this.resize();
    }

    /**
     * Resize the canvas to let it fit in the window. At the same time:
     * - update `unitPixel`.
     * - clear the canvas and redraw the solid blocks on the boundary of the map.
     */
    private resize() {
        this.unitPixel = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        this.app.renderer.resize(this.unitPixel * this.width, this.unitPixel * this.height);
        // initialize blocks
        this.blocks = Array(this.height).fill(null).map(() => Array(this.width).fill(""));
        if(this.blockImgs !== undefined) {
            for(const [i, row] of this.blockImgs.entries()) {
                for(const [j, child] of row.entries()) {
                    if(child) {
                        this.app.stage.removeChild(child);
                    }
                }
            }
        }
        // initialize tiles
        if(this.tiles !== undefined) {
            this.tiles.forEach(row => row.forEach(tile => this.app.stage.removeChild(tile.container))); // remove all previous tiles
        }
        // TODO: bug
        this.tiles = Array(this.height).fill(null).map((_, i) => Array(this.width).fill(null).map((_, j) => new Tile(0, 0, j, i, this.unitPixel)));
        this.tiles.forEach(row => row.forEach(tile => this.app.stage.addChild(tile.container)));
        // add solid blocks on the boundary of map
        this.blockImgs = Array(this.height).fill(null).map((i, _) => Array(this.width).fill(undefined));
        for(let i = 0; i < this.height; i++) {
            this.replaceSingleTile(i, 0, "SldBlk");
            this.replaceSingleTile(i, this.width - 1, "SldBlk");
        }
        for(let j = 1; j < this.width - 1; j++) {
            this.replaceSingleTile(0, j, "SldBlk");
            this.replaceSingleTile(this.height - 1, j, "SldBlk");
        }
    }

    setWidth(w: number) {
        this.width = w;
        this.resize();
    }

    setHeight(h: number) {
        this.height = h;
        this.resize();
    }

    /**
     * Replace a single block on the map. This would not perform any symmetry.
     * @param i column index
     * @param j row index
     * @param newName The name of new block to replace the original block. Can be left empty.
     * @param newHpInc The new hp increment of the block. Can be left empty.
     * @param newMoneyInc The new money increment of the block. Can be left empty.
     */
    replaceSingleTile(i: number, j: number, newName?: string, newHpInc?: number, newMoneyInc?: number) {
        if(newName !== undefined) {
            // update the block name
            this.blocks[i][j] = newName;
            if(this.blockImgs[i][j]) {
                this.app.stage.removeChild(this.blockImgs[i][j]!);
            }
            if(newName == "") {
                this.blockImgs[i][j] = undefined;
            } else {
                this.blockImgs[i][j] = constructInnerContainer(this.elements.get(newName)!, 1.0, 1.0, this);
                this.blockImgs[i][j]!.x = (j + 0.5) * this.unitPixel;
                this.blockImgs[i][j]!.y = (i + 0.5) * this.unitPixel;
                this.app.stage.addChild(this.blockImgs[i][j]!);
            }
        }
        if(newHpInc !== undefined) {
            // update the hp increment
            this.tiles[i][j].hpRecover = newHpInc;
        }
        if(newMoneyInc !== undefined) {
            // update the money increment
            this.tiles[i][j].moneyRecover = newMoneyInc;
        }
    }

    /**
     * Replace a single block on the map. This would perform symmetry based on the selected symmetry rule.
     * @param i column index
     * @param j row index
     * @param newName The name of new block to replace the original block. Can be left empty.
     * @param newHpInc The new hp increment of the block. Can be left empty.
     * @param newMoneyInc The new money increment of the block. Can be left empty.
     */
    replaceTile(i: number, j: number, newName?: string, newHpInc?: number, newMoneyInc?: number) {
        this.replaceSingleTile(i, j, newName, newHpInc, newMoneyInc);
        switch(this.symmetry) {
            case "none":
                break;
            case "horizontal":
                this.replaceSingleTile(i, this.width - 1 - j, newName, newHpInc, newMoneyInc);
                break;
            case "vertical":
                this.replaceSingleTile(this.height - 1 - i, j, newName, newHpInc, newMoneyInc);    
                break;
            case "rotational":
                this.replaceSingleTile(this.height - 1 - i, this.width - 1 - j, newName, newHpInc, newMoneyInc);
                break;
        }
    }

    /**
     * Handle clicking event on the canvas.
     * @param canvas the canvas element
     * @param e mouse event
     */
    canvasOnClick(canvas: HTMLCanvasElement, e: MouseEvent, hpIncrease?: number, moneyIncrease?: number) {
        const rect = canvas.getBoundingClientRect();
        const i = Math.floor((e.clientY - rect.top) / this.unitPixel);
        const j = Math.floor((e.clientX - rect.left) / this.unitPixel);
        if(e.ctrlKey || e.shiftKey) {
            // If the user is holding the control key, remove the block.
            // Remove the HP or money increase on the block based on the checkbox user selected.
            const newHpIncrease = (hpIncrease !== undefined) ? 0 : undefined;
            const newMoneyIncrease = (moneyIncrease !== undefined) ? 0 : undefined;
            this.replaceTile(i, j, "", newHpIncrease, newMoneyIncrease);
        } else {
            // Otherwise, place the block.
            // Place the HP or money increase on the block based on the checkbox user selected.
            this.replaceTile(i, j, this.activateBlock, hpIncrease, moneyIncrease);
        }
    }

    /**
     * Convert the blocks on the canvas into format of the "map creation" event.
     * @returns The event in JSON.
     */
    getMapCrtEvent(): MapCreateEvent {
        const tilesFlat = this.tiles.flat();
        const mapFlat: string[] = this.blocks.flat();
        const hpIncFlat: number[] = tilesFlat.map(tile => tile.hpRecover);
        const moneyIncFlat: number[] = tilesFlat.map(tile => tile.moneyRecover);
        return {
            "type": "MapCrt",
            "t": 0,
            "x": this.width,
            "y": this.height,
            "initUid": 0,
            "map": mapFlat,
            "incMap": {
                "hp": hpIncFlat,
                "money": moneyIncFlat,
            }
        }
    }
}