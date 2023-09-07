/**
 * This module handles player's actions (key pressing, clicking, game console input, etc.) and send
 * the actions to the server through websocket.
 */

import { GameDisplay, PlayerMode } from "./game-display";
import { PlayerElement } from "./player";

const KEY_TRACK_SPEED = [
    [ 1.0, 1.0 ],   // forward
    [ -1.0, -1.0 ], // backward
    [ -1.0, 1.0 ],  // left
    [ 1.0, -1.0]    // right
]

/**
 * The array of movement keys. Each element represents whether the corresponding key is pressed.
 * The order is [ forward, backward, left, right ].
 */
var movementKeys = [false, false, false, false];

function keyToAction(speed: number) {
    let lTrack = 0, rTrack = 0;
    movementKeys.forEach((v, i) => {
        if(v) {
            lTrack += KEY_TRACK_SPEED[i][0] * speed;
            rTrack += KEY_TRACK_SPEED[i][1] * speed;
        }
    });
    return [ `lTrack ${lTrack}`, `rTrack ${rTrack}` ]
}

export const actions: {
    keyDown: { [key: string]: (player: PlayerElement) => string[] },
    keyUp: { [key: string]: (player: PlayerElement) => string[] }
} = {
    keyDown: {
        "forward": (player) => {
            movementKeys[0] = true;
            return keyToAction(player.tankSpeed);
        },
        "backward": (player) => {
            movementKeys[1] = true;
            return keyToAction(player.tankSpeed);
        },
        "left": (player) => {
            movementKeys[2] = true;
            return keyToAction(player.tankSpeed);
        },
        "right": (player) => {
            movementKeys[3] = true;
            return keyToAction(player.tankSpeed);
        },
        "fire": () => [ "fire" ]
    },
    keyUp: {
        "forward": (player) => {
            movementKeys[0] = false;
            return keyToAction(player.tankSpeed);
        },
        "backward": (player) => {
            movementKeys[1] = false;
            return keyToAction(player.tankSpeed);
        },
        "left": (player) => {
            movementKeys[2] = false;
            return keyToAction(player.tankSpeed);
        },
        "right": (player) => {
            movementKeys[3] = false;
            return keyToAction(player.tankSpeed);
        }
    }
};

/**
 * Key binding.
 * The key binding is a map from the key code (e.g. W, A, S, D) to the action name (e.g. forward, backward).
 */
export type KeyBinding = Map<string, string>;

/**
 * Returns the event handler when a key is pressed.
 * @param game the game
 * @param mode real-time mode (because only real-time mode requires monitoring key events)
 * @param binding key binding
 * @returns The event handler represented by a lambda function.
 */
export function keyDownEvent(game: GameDisplay, mode: PlayerMode, binding: KeyBinding) {
    return (event: KeyboardEvent) => {
        const actionStr = binding.get(event.code);
        if(actionStr) {
            const action = actions.keyDown[actionStr];
            if(action) {
                for(const cmd of action(mode.myPlayer!!)) {
                    mode.socket.send(Math.floor(game.timer) + " " + cmd);
                }
            }
        }
    }
}

/**
 * Returns the event handler when a key is released.
 * @param game the game
 * @param mode real-time mode (because only real-time mode requires monitoring key events)
 * @param binding key binding
 * @returns The event handler represented by a lambda function.
 */
export function keyUpEvent(game: GameDisplay, mode: PlayerMode, binding: KeyBinding) {
    return (event: KeyboardEvent) => {
        const actionStr = binding.get(event.code);
        if(actionStr) {
            const action = actions.keyUp[actionStr];
            if(action) {
                for(const cmd of action(mode.myPlayer!!)) {
                    mode.socket.send(Math.floor(game.timer) + " " + cmd);
                }
            }
        }
    }
}

export type GamepadBinding = {
    "buttons": Map<number, string>,
    "axes": Map<number, string>,
};

var gamepadCache: { [key: string]: number | boolean } = {
    "lTrackDir": false,
    "rTrackDir": false,
    "fire": false,
    "lTrackSpeed": 0,
    "rTrackSpeed": 0,
};

function cacheToAction(game: GameDisplay, mode: PlayerMode) {
    if(mode.myPlayer != undefined) {
        const ans = [
            `lTrack ${(gamepadCache.lTrackSpeed as number) * (gamepadCache.lTrackDir ? -1 : 1) * mode.myPlayer.tankSpeed}`,
            `rTrack ${(gamepadCache.rTrackSpeed as number) * (gamepadCache.rTrackDir ? -1 : 1) * mode.myPlayer.tankSpeed}`
        ];
        if(gamepadCache.fire) {
            ans.push("fire");
        }
        return ans;
    } else {
        return [];
    }
}

export function gamepadLoop(game: GameDisplay, mode: PlayerMode, gamepad: Gamepad) {
    mode.gamepadBinding.buttons.forEach((action, buttonID) => {
        gamepadCache[action] = gamepad.buttons[buttonID].pressed;
    });
    // TODO: axes
    for(const str of cacheToAction(game, mode)) {
        // console.log(Math.floor(game.timer) + " " + str);
        mode.socket.send(Math.floor(game.timer) + " " + str);
    }
}