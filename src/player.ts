import * as PIXI from "pixi.js";
import { ElementData, GameElement } from "./element";
import { HSVtoRGB } from "./utils/color";
import { Game } from "./game";
import { GameUI } from "./game-ui";

/**
 * This list stores the first few colors that will be assigned to players.
 * If there are more players than the colors in the list, the game will generate random colors for the remaining players.
 */
export const PLAYER_COLOR_LIST = [
    new PIXI.Color("#114514"),
    new PIXI.Color("#191981"),
    new PIXI.Color("#ff6262")
];

var globl_player_color_index = 0;

/**
 * Generate a random color for the player.
 * @returns A random color.
 */
export function assignColor() {
    let color: PIXI.Color;
    if(globl_player_color_index < PLAYER_COLOR_LIST.length) {
        color = PLAYER_COLOR_LIST[globl_player_color_index];
        globl_player_color_index++;
        return color;
    } else {
        const value = Math.random() * 0.6 + 0.4; // generate random value between 0.4 and 1
        const hue = Math.random();
        const saturation = Math.random() * 0.3 + 0.7;
        color = HSVtoRGB(hue, saturation, value);
    }
    return color;
}

/**
 * Player state. This is the state of the player that will be displayed on the left side of the screen.
 */
export type PlayerState = {
    alive: boolean;
    money: number;        // Amount of money the player currently owns.
    hp: number;
    maxHp: number;
    visionRadius: number; // Vision radius
    speed: number;
    debugString: string;  // A string that will be displayed on the screen. Reserved for debugging.
};

export const VISION_CIRC_WIDTH = 0.04;  // in game unit

export class PlayerElement extends GameElement {
    alive: boolean = true;      // When the player is dead, this field is set to false.
    name: string;               // Name of the player.
    color: PIXI.Color;          // Theme color (tank color and text color) of the player.
    money: number;              // Amount of money the player currently owns.
    tankSpeed: number;          // Maximum speed of the tank's left and right track.
    visionRadius: number;       // Vision radius
    visionCirc?: PIXI.Graphics; // A circle on the screen indicating the vision range of the player.
    debugStr: string;
    setState?: (state: PlayerState) => void;

    constructor(
        type: ElementData,
        gameIn: GameUI,
        x: number,
        y: number,
        name: string,
        rad?: number,
        maxHp?: number,
        color?: PIXI.Color
    ) {
        super(type, gameIn, x, y, rad, type.width, type.height, color);
        this.name = name;
        this.maxHp = maxHp ?? gameIn.options.defaultPlayerProp.mHP;
        this.hp = this.maxHp;
        this.color = color ?? assignColor();
        this.money = gameIn.options.defaultPlayerProp.money;
        this.tankSpeed = gameIn.options.defaultPlayerProp.tkSpd;
        this.visionRadius = gameIn.options.defaultPlayerProp.visRad;
        this.debugStr = "";
        this.update();
    }

    /**
     * Override the update method of GameElement.
     * 
     * In player's update, we also update the state of the player displayed on the left and the
     * vision circle if the vision circle is enabled.
     */
    override update() {
        super.update();
        this.setState?.(this.getState());
        if(this.gameIn.options.displayVisionCirc) {
            if(this.visionCirc) {
                this.visionCirc.clear();
            } else {
                this.visionCirc = new PIXI.Graphics();
                this.outerContainer.addChild(this.visionCirc);
            }
            this.visionCirc.lineStyle(VISION_CIRC_WIDTH * this.gameIn.unitPixel, this.color, 0.5);
            this.visionCirc.drawCircle(0, 0, this.visionRadius * this.gameIn.unitPixel);
        }
    }

    getState(): PlayerState {
        return {
            alive: this.alive,
            money: this.money,
            hp: this.hp!,
            maxHp: this.maxHp!,
            visionRadius: this.visionRadius,
            speed: this.tankSpeed,
            debugString: this.debugStr,
        };
    }
}