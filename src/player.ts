import * as PIXI from "pixi.js";
import { GameElement } from "./element";
import { HSVtoRGB } from "./utils/color";

export const PLAYER_COLOR_LIST = [
    new PIXI.Color("#114514"),
    new PIXI.Color("#191981"),
    new PIXI.Color("#ff6262")
];

var globl_player_color_index = 0;

export function assign_color() {
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

export class Player {
    element: GameElement;     // The element which player is controlling.
    name: string;             // Name of the player.
    color: PIXI.Color;             // Theme color (tank color and text color) of the player.
    visionRadius: number;     // Radius of vision of the player.
    money: number;            // Amount of money the player currently owns.

    constructor(element: GameElement, name: string, visionRange: number, color?: PIXI.Color, money?: number) {
        this.element = element;
        this.name = name;
        this.visionRadius = visionRange;
        this.money = money ?? 0;
        this.color = color ?? assign_color();
    }
}