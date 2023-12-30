import { Game } from "./game-display";
import { PlayerElement } from "./player";

export class KeyMap {
    keyDownHandler: { [key: string]: (() => string[])[] } = {};
    keyUpHandler: { [key: string]: (() => string[])[] } = {};
    
    addKeyDownHandler(key: string, handler: () => string[]) {
        if(this.keyDownHandler[key] === undefined) {
            this.keyDownHandler[key] = [handler];
        } else {
            this.keyDownHandler[key].push(handler);
        }
    }

    addKeyUpHandler(key: string, handler: () => string[]) {
        if(this.keyUpHandler[key] === undefined) {
            this.keyUpHandler[key] = [handler];
        } else {
            this.keyUpHandler[key].push(handler);
        }
    }

    onKeyDown(key: string) {
        if(this.keyDownHandler[key] === undefined) {
            return [];
        }
        return this.keyDownHandler[key].map(handler => handler()).flat();
    }

    onKeyUp(key: string) {
        if(this.keyUpHandler[key] === undefined) {
            return [];
        }
        return this.keyUpHandler[key].map(handler => handler()).flat();
    }
}

export type KeyBinding = (keymap: KeyMap, game: Game, player: PlayerElement) => void;

export type GamepadBinding = (gamepad: Gamepad, game: Game, player: PlayerElement) => string[];