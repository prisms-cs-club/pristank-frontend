import { ElementData, constructInnerContainer } from "./element";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";

const ELEMENT_DATA_LOCATION: string = "/resource/element-data.json";
const TEXTURES_LOCATION: string = "/resource/textures.json";

const loadBlockData: Task<Map<string, ElementData>> = {
    prerequisite: [],
    callback: async () => {
        const data = await fetch(ELEMENT_DATA_LOCATION).then(data => data.json()) as { [key: string]: ElementData };
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
        const textureNames = Object.entries(await (await fetch(TEXTURES_LOCATION)).json() as { [key: string]: string });
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
    blocks!: string[][];                           // Serial names of each block. `blocks[j][i]` is the block on jth row and ith colume.
    blockImgs!: (PIXI.Container | undefined)[][];  // Images of each block on the canvas.
    
    // the following fields are modifiable by the UI
    activateBlock: string = "";
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

    private resize() {
        this.unitPixel = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        this.app.renderer.resize(this.unitPixel * this.width, this.unitPixel * this.height);
        this.blocks = Array(this.height).fill(null).map(() => Array(this.width).fill(""));
        if(this.blockImgs != undefined) {
            for(const [i, row] of this.blockImgs.entries()) {
                for(const [j, child] of row.entries()) {
                    if(child) {
                        this.app.stage.removeChild(child);
                    }
                }
            }
        }
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

    replaceSingleTile(i: number, j: number, newName: string) {
        this.blocks[i][j] = newName;
        if(this.blockImgs[i][j]) {
            this.app.stage.removeChild(this.blockImgs[i][j]!!);
        }
        if(newName == "") {
            this.blockImgs[i][j] = undefined;
        } else {
            this.blockImgs[i][j] = constructInnerContainer(this.elements.get(newName)!!, 1.0, 1.0, this);
            this.blockImgs[i][j]!!.x = (j + 0.5) * this.unitPixel;
            this.blockImgs[i][j]!!.y = (i + 0.5) * this.unitPixel;
            this.app.stage.addChild(this.blockImgs[i][j]!!);
        }
    }

    replaceTile(i: number, j: number, newName: string) {
        this.replaceSingleTile(i, j, newName);
        switch(this.symmetry) {
            case "none":
                break;
            case "horizontal":
                this.replaceSingleTile(i, this.width - 1 - j, newName);
                break;
            case "vertical":
                this.replaceSingleTile(this.height - 1 - i, j, newName);    
                break;
            case "rotational":
                this.replaceSingleTile(this.height - 1 - i, this.width - 1 - j, newName);
                break;
        }
    }

    canvasOnClick(canvas: HTMLCanvasElement, e: MouseEvent) {
        if(this.activateBlock != "") {
            const rect = canvas.getBoundingClientRect();
            const i = Math.floor((e.clientY - rect.top) / this.unitPixel);
            const j = Math.floor((e.clientX - rect.left) / this.unitPixel);
            if(e.ctrlKey || e.shiftKey) {
                this.replaceTile(i, j, "");
            } else {
                this.replaceTile(i, j, this.activateBlock);
            }
        }
    }

    getMapCrtEvent(): { [key: string]: any } {
        const mapFlatten: string[] = [];
        for(const row of this.blocks) {
            for(const name of row) {
                mapFlatten.push(name);
            }
        }
        return {
            "type": "MapCrt",
            "t": 0,
            "x": this.width,
            "y": this.height,
            "initUid": 0,
            "map": mapFlatten,
        }
    }
}