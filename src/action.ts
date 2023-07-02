const speed = 1.0;
const KEY_TRACK_SPEED = [
    [ 1.0, 1.0 ],   // forward
    [ -1.0, -1.0 ], // backward
    [ -1.0, 1.0 ],  // left
    [ 1.0, -1.0]    // right
]

var key = [false, false, false, false];

function keyToAction() {
    let lTrack = 0, rTrack = 0;
    key.forEach((v, i) => {
        if(v) {
            lTrack += KEY_TRACK_SPEED[i][0];
            rTrack += KEY_TRACK_SPEED[i][1];
        }
    });
    return [ `lTrack ${lTrack}`, `rTrack ${rTrack}` ]
}

export const actions: {
    keyDown: { [key: string]: () => string[] },
    keyUp: { [key: string]: () => string[] }
} = {
    keyDown: {
        "forward": () => {
            key[0] = true;
            return keyToAction();
        },
        "backward": () => {
            key[1] = true;
            return keyToAction();
        },
        "left": () => {
            key[2] = true;
            return keyToAction();
        },
        "right": () => {
            key[3] = true;
            return keyToAction();
        },
        "fire": () => [ "fire" ]
    },
    keyUp: {
        "forward": () => {
            key[0] = false;
            return keyToAction();
        },
        "backward": () => {
            key[1] = false;
            return keyToAction();
        },
        "left": () => {
            key[2] = false;
            return keyToAction();
        },
        "right": () => {
            key[3] = false;
            return keyToAction();
        }
    }
};

export type KeyBinding = Map<string, string>;