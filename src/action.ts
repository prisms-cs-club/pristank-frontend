import { GameDisplay } from "./game-display";
import { PlayerElement } from "./player";

const KEY_TRACK_SPEED = [
    [ 1.0, 1.0 ],   // forward
    [ -1.0, -1.0 ], // backward
    [ -1.0, 1.0 ],  // left
    [ 1.0, -1.0]    // right
]

var key = [false, false, false, false];

function keyToAction(speed: number) {
    let lTrack = 0, rTrack = 0;
    key.forEach((v, i) => {
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
            key[0] = true;
            return keyToAction(player.speed);
        },
        "backward": (player) => {
            key[1] = true;
            return keyToAction(player.speed);
        },
        "left": (player) => {
            key[2] = true;
            return keyToAction(player.speed);
        },
        "right": (player) => {
            key[3] = true;
            return keyToAction(player.speed);
        },
        "fire": () => [ "fire" ]
    },
    keyUp: {
        "forward": (player) => {
            key[0] = false;
            return keyToAction(player.speed);
        },
        "backward": (player) => {
            key[1] = false;
            return keyToAction(player.speed);
        },
        "left": (player) => {
            key[2] = false;
            return keyToAction(player.speed);
        },
        "right": (player) => {
            key[3] = false;
            return keyToAction(player.speed);
        }
    }
};

export type KeyBinding = Map<string, string>;