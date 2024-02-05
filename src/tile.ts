/**
 * This module is for displaying the tile information. It shows each tile's HP recover and money recover rate with
 * the `Tile` class, which displays the information with stripes of different opacity and color.
 */

import * as PIXI from 'pixi.js';

/**
 * @param mask The mask to be drawn on
 * @param unitPixel number of pixels in a game unit
 * @param color The color of the mask
 * @returns The mask for the upper half stripe of a tile
 */
export function getTileUpperHalfMask(mask: PIXI.Graphics, unitPixel: number, color: PIXI.Color): PIXI.Graphics {
    const quarterUnit = 0.25 * unitPixel;
    const halfUnit = 0.5 * unitPixel;
    const threeQuarterUnit = 0.75 * unitPixel;
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

/**
 * @param mask The mask to be drawn on
 * @param unitPixel number of pixels in a game unit
 * @param color The color of the mask
 */
export function getTileLowerHalfMask(mask: PIXI.Graphics, unitPixel: number, color: PIXI.Color): PIXI.Graphics {
    const quarterUnit = 0.25 * unitPixel;
    const halfUnit = 0.5 * unitPixel;
    const threeQuarterUnit = 0.75 * unitPixel;
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

export const MAX_HP_RECOVER = 20;
export const MAX_MONEY_RECOVER = 20;
// export const HP_COLOR = '#ffbcc6';
export const HP_COLOR = new Uint8Array([255, 188, 182]);
// export const MONEY_COLOR = '#ffffb6';
export const MONEY_COLOR = new Uint8Array([255, 255, 182]);

export class Tile {
    private _hpRecover: number;
    private _moneyRecover: number;
    private _upperHalf: PIXI.Graphics;
    private _lowerHalf: PIXI.Graphics;
    container: PIXI.Container;
    unitPixel: number;

    constructor(hpRecover: number, moneyRecover: number, x: number, y: number, unitPixel: number) {
        this._hpRecover = hpRecover;
        this._moneyRecover = moneyRecover;
        this.unitPixel = unitPixel;
        this.container = new PIXI.Container();
        this.container.x = x * unitPixel;
        this.container.y = y * unitPixel;
        this._upperHalf = new PIXI.Graphics();
        getTileUpperHalfMask(this._upperHalf, unitPixel, new PIXI.Color(HP_COLOR).setAlpha(hpRecover / MAX_HP_RECOVER));
        this.container.addChild(this._upperHalf);
        this._lowerHalf = new PIXI.Graphics();
        getTileLowerHalfMask(this._lowerHalf, unitPixel, new PIXI.Color(MONEY_COLOR).setAlpha(moneyRecover / MAX_MONEY_RECOVER));
        this.container.addChild(this._lowerHalf);
    }

    set hpRecover(hpRecover: number) {
        this._hpRecover = hpRecover;
        this._upperHalf.clear();
        getTileUpperHalfMask(this._upperHalf, this.unitPixel, new PIXI.Color(HP_COLOR).setAlpha(hpRecover / MAX_HP_RECOVER));
    }

    get hpRecover() {
        return this._hpRecover;
    }

    set moneyRecover(moneyRecover: number) {
        this._moneyRecover = moneyRecover;
        this._lowerHalf.clear();
        getTileLowerHalfMask(this._lowerHalf, this.unitPixel, new PIXI.Color(MONEY_COLOR).setAlpha(moneyRecover / MAX_MONEY_RECOVER));
    }

    get moneyRecover() {
        return this._moneyRecover;
    }
}
