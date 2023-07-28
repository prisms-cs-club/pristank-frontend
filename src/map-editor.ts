import { ElementData, constructInnerContainer } from "./element";
import { GameDisplay } from "./game-display";
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

const loadTextures: Task<Map<string, PIXI.Texture>> = {
    prerequisite: [],
    callback: async () => {
        const textures = new Map<string, PIXI.Texture>();
        const textureNames = (await fetch(TEXTURES_LOCATION)).json();
        for(const [name, file] of Object.entries(await textureNames)) {
            textures.set(name, PIXI.Texture.from(`/resource/texture/${file}`));
        }
        return textures;
    }
}

const init: Task<MapEditor> = {
    prerequisite: ["load block data", "load textures"],
    callback: async (blockData: Map<string, ElementData>, textures: Map<string, PIXI.Texture>) => {
        return new MapEditor(blockData, textures);
    }
};

export const loadMapEditor = new Tasker({
    "load block data": loadBlockData,
    "load textures": loadTextures,
    "initialize": init,
}, "initialize");

export class MapEditor {
    // TODO: not completed
    elements: Map<string, ElementData>;
    textures: Map<string, PIXI.Texture>;
    app: PIXI.Application;
    width: number = 10;
    height: number = 10;
    unitPixel: number = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
    blocks!: string[][];
    blockImgs!: (PIXI.Container | undefined)[][];
    
    constructor(elements: Map<string, ElementData>, textures: Map<string, PIXI.Texture>) {
        this.elements = elements;
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
        this.blockImgs = Array(this.height).fill(null).map((i, _) => Array(this.width).fill(undefined));
        for(let i = 0; i < this.height; i++) {
            this.replaceTile(i, 0, "SldBlk");
            this.replaceTile(i, this.width - 1, "SldBlk");
        }
        for(let j = 1; j < this.width - 1; j++) {
            this.replaceTile(0, j, "SldBlk");
            this.replaceTile(this.height - 1, j, "SldBlk");
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

    replaceTile(i: number, j: number, newName: string) {
        this.blocks[i][j] = newName;
        if(this.blockImgs[i][j]) {
            this.app.stage.removeChild(this.blockImgs[i][j]!!);
        }
        this.blockImgs[i][j] = constructInnerContainer(this.elements.get(newName)!!, 1.0, 1.0, this);
        this.blockImgs[i][j]!!.x = (j + 0.5) * this.unitPixel;
        this.blockImgs[i][j]!!.y = (i + 0.5) * this.unitPixel;
        this.app.stage.addChild(this.blockImgs[i][j]!!);
    }
}