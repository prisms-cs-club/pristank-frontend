import { threadId } from "worker_threads";
import { GameDisplay } from "./game-display";
import * as PIXI from "pixi.js";

const HP_BAR_VERTICAL_BIAS = 5; // The vertical distance between the top of element and the bottom of HP bar in pixels
const HP_BAR_WIDTH = 50;        // The width of HP bar in pixels
const HP_BAR_HEIGHT = 5;        // The height of HP bar in pixels

/**
 * `ElementData` gives the default data for a specific type of element, such as tank, bullet, etc.
 */
export type ElementData = {
    group: string;
    width: number;
    height: number;
    hp?: number;     // max hp
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
    hpBar?: PIXI.Graphics;
    outerContainer: PIXI.Container;   // container that has not been rotated
    innerContainer: PIXI.Container;   // container that has been rotated

    constructor(type: ElementData, gameIn: GameDisplay, x: number, y: number, rad?: number, width?: number, height?: number, bgColor?: PIXI.Color) {
        this.type = type;
        this.gameIn = gameIn;
        this.x = x;
        this.y = y;
        this.rad = rad ?? 0;
        this.width = width ?? type.width;
        this.height = height ?? type.height;
        this.hp = type.hp;
        this.outerContainer = new PIXI.Container();
        this.innerContainer = new PIXI.Container();
        this.outerContainer.addChild(this.innerContainer);
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
                this.innerContainer.addChild(rect);
            }
            this.innerContainer.addChild(sprite);
        }
    }

    /**
     * Update the container's position and rotation.
     */
    update() {
        this.outerContainer.x = this.x * this.gameIn.unitPixel;
        this.outerContainer.y = (this.gameIn.height - this.y) * this.gameIn.unitPixel;
        this.innerContainer.rotation = -this.rad;    // Because in PIXI.js, `rotation` is the angle rotating clockwise
                                                // and we want counterclockwise rotation
        if(this.gameIn.options.displayHP && this.hp && this.type.hp && this.hp != this.type.hp) {
            // Add HP bar
            if(!this.hpBar) {
                this.hpBar = new PIXI.Graphics();
                this.outerContainer.addChild(this.hpBar);
            }
            const hpRatio = this.hp / this.type.hp;
            this.hpBar.clear();
            this.hpBar.beginFill(new PIXI.Color([1 - hpRatio, hpRatio, 0]));
            let topLeftY = -this.height * this.gameIn.unitPixel * 0.8 - HP_BAR_VERTICAL_BIAS;
            if(topLeftY + this.outerContainer.y <= 0) {
                topLeftY = this.height * this.gameIn.unitPixel * 0.8 + HP_BAR_VERTICAL_BIAS;
            }
            this.hpBar.drawRect(-HP_BAR_WIDTH / 2, topLeftY, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT);
        }
    }
}