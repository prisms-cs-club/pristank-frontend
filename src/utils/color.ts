import { Color } from "pixi.js";

/**
 * Convert color from HSV to RGB.
 * @param h hue
 * @param s saturation
 * @param v value
 * @returns A PIXI.Color object which stores the desired color in RGB.
 */
export function HSVtoRGB(h: number, s: number, v: number) {
    let r: number = 0, g: number = 0, b: number = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return new Color([r, g, b]);
}