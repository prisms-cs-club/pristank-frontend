/**
 * This module is for displaying the tile information. It shows each tile's HP recover and money recover rate with
 * the `Tile` class, which displays the information with stripes of different opacity and color.
 */

import * as PIXI from 'pixi.js';

/**
 * 
 * @param unitPixel number of pixels in a game unit
 * @returns The mask for the upper half stripe of a tile
 */
export function getTileUpperHalfMask(unitPixel: number, color: PIXI.Color): PIXI.Graphics {
    const quarterUnit = 0.25 * unitPixel;
    const halfUnit = 0.5 * unitPixel;
    const threeQuarterUnit = 0.75 * unitPixel;
    const mask = new PIXI.Graphics();
    mask.lineStyle(0);
    mask.beginFill(color);
    mask.drawPolygon([
        0, 0,
        0, quarterUnit,
        quarterUnit, 0,
    ]);
    mask.drawPolygon([
        0, halfUnit,
        0, threeQuarterUnit,
        threeQuarterUnit, 0,
        halfUnit, 0,
    ]);
    mask.drawPolygon([
        0, unitPixel,
        quarterUnit, unitPixel,
        unitPixel, quarterUnit,
        unitPixel, 0,
    ]);
    mask.drawPolygon([
        halfUnit, unitPixel,
        threeQuarterUnit, unitPixel,
        unitPixel, threeQuarterUnit,
        unitPixel, halfUnit,
    ]);
    mask.endFill();
    return mask;
}

export function getLowerHalfMask(unitPixel: number, color: PIXI.Color): PIXI.Graphics {
    const quarterUnit = 0.25 * unitPixel;
    const halfUnit = 0.5 * unitPixel;
    const threeQuarterUnit = 0.75 * unitPixel;
    const mask = new PIXI.Graphics();
    mask.lineStyle(0);
    mask.beginFill(color);
    mask.drawPolygon([
        0, quarterUnit,
        0, halfUnit,
        halfUnit, 0,
        quarterUnit, 0,
    ]);
    mask.drawPolygon([
        0, threeQuarterUnit,
        0, unitPixel,
        unitPixel, 0,
        threeQuarterUnit, 0,
    ]);
    mask.drawPolygon([
        quarterUnit, unitPixel,
        halfUnit, unitPixel,
        unitPixel, halfUnit,
        unitPixel, quarterUnit,
    ]);
    mask.drawPolygon([
        threeQuarterUnit, unitPixel,
        unitPixel, unitPixel,
        unitPixel, threeQuarterUnit,
    ]);
    mask.endFill();
    return mask;
}

const MAX_HP_RECOVER = 20;
const MAX_MONEY_RECOVER = 20;
const HP_COLOR = new PIXI.Color('#ffbcb6');
const MONEY_COLOR = new PIXI.Color('#ffffb6');

export class Tile {
    hpRecover: number;
    moneyRecover: number;
    container: PIXI.Container;

    constructor(hpRecover: number, moneyRecover: number, x: number, y: number, unitPixel: number) {
        this.hpRecover = hpRecover;
        this.moneyRecover = moneyRecover;
        this.container = new PIXI.Container();
        this.container.x = x * unitPixel;
        this.container.y = y * unitPixel;
        this.container.addChild(getTileUpperHalfMask(unitPixel, HP_COLOR.setAlpha(hpRecover / MAX_HP_RECOVER)));
        this.container.addChild(getLowerHalfMask(unitPixel, MONEY_COLOR.setAlpha(moneyRecover / MAX_MONEY_RECOVER)));
    }
}
