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

/*** Gamepad ***/

export type GamepadBinding = {
    "mode": 1 | 2,
    "buttons": Map<number, string>,
    "axes": Map<number, string>,
};

/**
 * This array defines the two gamepad modes.
 * 
 * Each element is a function that takes the gamepad input and the player mode, and returns
 * the commands to be sent to the server.
 * 
 * TODO: optimize the gamepad mode
 */
const gamepadModes: ((input: { [key: string]: number }, player: PlayerElement, mode: PlayerMode) => string[])[] = [
    function(_) { return []; },  // placeholder for mode 0
    function(input: { [key: string]: number }, player: PlayerElement, mode: PlayerMode) {
        // mode 1: B6 and B7 controls the left and right track speed, B4 and B5 controls the left and right track direction
        const ans = [
            `lTrack ${(input.lTrackSpeed) * (input.lTrackDir ? -1 : 1) * player.tankSpeed}`,
            `rTrack ${(input.rTrackSpeed) * (input.rTrackDir ? -1 : 1) * player.tankSpeed}`
        ];
        if(input.fire) {
            ans.push("fire");
        }
        return ans;
    },
    function(input: { [key: string]: number }, player: PlayerElement, mode: PlayerMode) {
        // mode 2: two axes controls the direction of the tank, and one button controls the speed of the tank
        function axesCurve(x: number) {
            return Math.sign(x) * Math.sqrt(Math.abs(x));
        }
        const leftTrackMul = axesCurve((input.dirX - input.dirY) * Math.SQRT1_2);
        const rightTrackMul = axesCurve((-input.dirX - input.dirY) * Math.SQRT1_2);
        console.log(leftTrackMul, rightTrackMul, input.speed);
        const ans = [
            `lTrack ${leftTrackMul * player.tankSpeed * input.speed}`,
            `rTrack ${rightTrackMul * player.tankSpeed * input.speed}`
        ];
        if(input.fire) {
            ans.push("fire");
        }
        return ans;
    }
];

/**
 * This is run with the game main loop to read the gamepad input and send the commands to the
 * server, once a gamepad is connected.
 * @param game game display
 * @param mode player mode
 * @param gamepad gamepad object to read input from
 */
export function gamepadLoop(game: GameDisplay, mode: PlayerMode, gamepad: Gamepad) {
    if(mode.myPlayer != undefined) {
        const gamepadInput: { [key: string]: number } = {};
        mode.gamepadBinding.buttons.forEach((action, buttonID) => {
            gamepadInput[action] = gamepad.buttons[buttonID].value;
        });
        mode.gamepadBinding.axes.forEach((action, axisID) => {
            gamepadInput[action] = gamepad.axes[axisID];
        });
        for(const str of gamepadModes[mode.gamepadBinding.mode](gamepadInput, mode.myPlayer, mode)) {
            //// console.log(Math.floor(game.timer) + " " + str);
            mode.socket.send(Math.floor(game.timer) + " " + str);
        }
    }
}