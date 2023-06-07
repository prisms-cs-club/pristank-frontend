import { GameElement } from "./element";

export class Player {
    element: GameElement;     // The element which player is controlling.
    visionRange: number;      // The radius of vision of the player.
    money: number;            // The amount of money the player has.

    constructor(element: GameElement, visionRange: number, money?: number) {
        this.element = element;
        this.visionRange = visionRange;
        this.money = money ?? 0;
    }
}