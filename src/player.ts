import * as PIXI from "pixi.js";
import { ElementData, GameElement } from "./element";
import { HSVtoRGB } from "./utils/color";
import { GameDisplay } from "./game-display";

export const PLAYER_COLOR_LIST = [
    new PIXI.Color("#114514"),
    new PIXI.Color("#191981"),
    new PIXI.Color("#ff6262")
];

var globl_player_color_index = 0;

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
    money: number;        // Amount of money the player currently owns.
    hp: number;
    maxHp: number;
    visionRadius: number; // Vision radius
};

export class PlayerElement extends GameElement {
    name: string;             // Name of the player.
    color: PIXI.Color;        // Theme color (tank color and text color) of the player.
    money: number;            // Amount of money the player currently owns.
    visionRadius: number;     // Vision radius
    setState?: (state: PlayerState) => void;

    constructor(
        type: ElementData,
        gameIn: GameDisplay,
        x: number,
        y: number,
        name: string,
        visionRadius: number,
        rad?: number,
        money?: number,
        maxHp?: number,
        color?: PIXI.Color
    ) {
        super(type, gameIn, x, y, rad, type.width, type.height, color);
        this.name = name;
        this.money = money ?? 0;
        this.visionRadius = visionRadius;
        this.maxHp = maxHp ?? type.hp!!;
        this.color = color ?? assignColor();
    }

    override update() {
        super.update();
        this.setState?.(this.getState());
    }

    getState(): PlayerState {
        return {
            money: this.money,
            hp: this.hp!!,
            maxHp: this.maxHp!!,
            visionRadius: this.visionRadius
        };
    }
}