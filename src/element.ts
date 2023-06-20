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
    width: number;
    height: number;
    bgColor: boolean;   // whether this part need a background
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

    constructor(type: ElementData, gameIn: GameDisplay, x: number, y: number, rad?: number, width?: number, height?: number, bgColor?: PIXI.Color) {
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
            sprite.anchor.set(0.5);
            sprite.x = this.width * this.gameIn.unitPixel * part.xOffset;
            sprite.y = this.height * this.gameIn.unitPixel * part.yOffset;
            sprite.width = this.width * this.gameIn.unitPixel * part.width;
            sprite.height = this.height * this.gameIn.unitPixel * part.height;
            if(part.bgColor && bgColor) {
                // add a rectangle filled with the background color
                const rect = new PIXI.Graphics();
                rect.beginFill(bgColor);
                rect.drawRect(sprite.x - sprite.width * 0.5, sprite.y - sprite.height * 0.5, sprite.width, sprite.height);
                this.container.addChild(rect);
            }
            this.container.addChild(sprite);
        }
    }

    /**
     * Update the container's position and rotation.
     */
    update() {
        this.container.x = this.x * this.gameIn.unitPixel;
        this.container.y = (this.gameIn.height - this.y) * this.gameIn.unitPixel;
        this.container.rotation = -this.rad;    // Because in PIXI.js, `rotation` is the angle rotating clockwise
                                                // and we want counterclockwise rotation
    }
}