import { Game } from "./game";
import { PlayerElement } from "./player";

export class KeyMap {
    private keyDownHandler: { [key: string]: (() => string[])[] } = {};
    private keyUpHandler: { [key: string]: (() => string[])[] } = {};
    
    /**
     * Add a new handler for a key down event.
     * @param key The key to bind to
     * @param handler The handler function that returns a list of commands.
     */
    addKeyDownHandler(key: string, handler: () => string[]) {
        if(this.keyDownHandler[key] === undefined) {
            this.keyDownHandler[key] = [handler];
        } else {
            this.keyDownHandler[key].push(handler);
        }
    }

    /**
     * Add a new handler for a key up event.
     * @param key The key to bind to
     * @param handler The handler function that returns a list of commands.
     */
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

export type KeyBinding = (keymap: KeyMap, player: PlayerElement) => void;

export type GamepadBinding = (gamepad: Gamepad, player: PlayerElement) => string[];