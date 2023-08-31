import { threadId } from "worker_threads";
import { GameDisplay } from "./game-display";
import * as PIXI from "pixi.js";
import { MapEditor } from "./map-editor";

const HP_BAR_VERTICAL_BIAS = 5; // The vertical distance between the top of element and the bottom of HP bar in pixels
const HP_BAR_WIDTH = 50;        // The width of HP bar in pixels
const HP_BAR_HEIGHT = 5;        // The height of HP bar in pixels

export function constructInnerContainer(type: ElementData, width: number, height: number, parent: MapEditor | GameDisplay, bgColor?: PIXI.Color) {
    const container = new PIXI.Container();
    for(const part of type.parts) {
        const sprite = new PIXI.Sprite(parent.textures.get(part.img));
        sprite.anchor.set(0.5);
        sprite.x = width * parent.unitPixel * part.xOffset;
        sprite.y = height * parent.unitPixel * part.yOffset;
        sprite.width = width * parent.unitPixel * part.width;
        sprite.height = height * parent.unitPixel * part.height;
        if(part.bgColor && bgColor) {
            // add a rectangle filled with the background color
            const rect = new PIXI.Graphics();
            rect.beginFill(bgColor);
            rect.drawRect(sprite.x - sprite.width * 0.5, sprite.y - sprite.height * 0.5, sprite.width, sprite.height);
            container.addChild(rect);
        }
        container.addChild(sprite);
    }
    return container;
}

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
    // properties
    type: ElementData;
    gameIn: GameDisplay;
    x: number;
    y: number;
    rad: number;
    width: number;
    height: number;
    hp?: number;
    maxHp?: number;
    visible: boolean = true;          // whether this element is visible to the player
                                      // It should be guaranteed that if the element is invisible, it will not be displayed on the game canvas.

    // graphics elements
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
        this.maxHp = type.hp;
        this.hp = type.hp;
        this.outerContainer = new PIXI.Container();
        this.innerContainer = constructInnerContainer(type, this.width, this.height, this.gameIn, bgColor);
        this.outerContainer.addChild(this.innerContainer);
        this.update();
    }

    /**
     * Update the container's position and rotation.
     */
    update() {
        this.outerContainer.x = this.x * this.gameIn.unitPixel;
        this.outerContainer.y = (this.gameIn.height - this.y) * this.gameIn.unitPixel;
        this.innerContainer.rotation = -this.rad;   // Because in PIXI.js, `rotation` is the angle rotating clockwise
                                                    // and we want counterclockwise rotation
        if(this.gameIn.options.displayHP && this.hp && this.maxHp && this.hp != this.maxHp) {
            // Add HP bar
            if(!this.hpBar) {
                this.hpBar = new PIXI.Graphics();
                // HP bar is added to the outer container since it should not be rotated with the tank
                this.outerContainer.addChild(this.hpBar);
            }
            const hpRatio = this.hp / this.maxHp;
            this.hpBar.clear();
            this.hpBar.beginFill(new PIXI.Color([1 - hpRatio, hpRatio, 0]));
            let topLeftY = -this.height * this.gameIn.unitPixel * 0.8 - HP_BAR_VERTICAL_BIAS;
            if(topLeftY + this.outerContainer.y <= 0) {
                topLeftY = this.height * this.gameIn.unitPixel * 0.8 + HP_BAR_VERTICAL_BIAS;
            }
            this.hpBar.drawRect(-HP_BAR_WIDTH / 2, topLeftY, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT);
        }
    }

    /**
     * Get the Euclidean distance from the center of this element to another element.
     * @param elem The other element
     * @returns The distance between this element and the other element
     */
    getDistanceTo(elem: GameElement): number {
        return Math.sqrt((this.x - elem.x) ** 2 + (this.y - elem.y) ** 2);
    }
}