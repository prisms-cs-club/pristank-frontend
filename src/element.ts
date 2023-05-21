import { threadId } from "worker_threads";
import { GameDisplay } from "./game-display";
import * as PIXI from "pixi.js";

/**
 * `ElementData` gives the default data for a specific type of element, such as tank, bullet, etc.
 */
export type ElementData = {
    group: string;
    width: number;
    height: number;
    hp?: number;
    parts: ElementModelPart[];
}

export type ElementModelPart = {
    img: string;
    xOffset: number;
    yOffset: number;
};

/**
 * Defines an element that may be displayed on the game screen.
 */
export class GameElement {
    type: ElementData;
    gameIn: GameDisplay;
    x: number;
    y: number;
    rad: number;
    width: number;
    height: number;
    hp?: number;
    container: PIXI.Container;

    constructor(type: ElementData, gameIn: GameDisplay, x: number, y: number, rad?: number, width?: number, height?: number) {
        this.type = type;
        this.gameIn = gameIn;
        this.x = x;
        this.y = y;
        this.rad = rad ?? 0;
        this.width = width ?? type.width;
        this.height = height ?? type.height;
        this.hp = type.hp;
        this.container = new PIXI.Container();
        this.update();
        for(const part of type.parts) {
            const sprite = new PIXI.Sprite(this.gameIn.textures.get(part.img));
            sprite.x = this.container.x + this.container.width * part.xOffset;
            sprite.y = this.container.y + this.container.height * part.yOffset;
            this.container.addChild(sprite);
        }
    }

    /**
     * Update the container's position and rotation.
     */
    update() {
        this.container.x = this.x * this.gameIn.unitPixel;
        this.container.y = this.y * this.gameIn.unitPixel;
        this.container.rotation = this.rad;
    }
}