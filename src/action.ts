export const actions: {
    keyDown: { [key: string]: string[] },
    keyUp: { [key: string]: string[] }
} = {
    keyDown: {
        "forward": [ "lTrack 1.0", "rTrack 1.0" ],
        "backward": [ "lTrack 0.0", "rTrack 0.0" ],
        "left": [ "lTrack -1.0", "rTrack 1.0" ],
        "right": [ "lTrack 1.0", "rTrack -1.0" ],
        "fire": [ "fire" ]
    },
    keyUp: {
        "forward": [ "lTrack 0.0", "rTrack 0.0" ],
        "backward": [ "lTrack 0.0", "rTrack 0.0" ],
        "left": [ "lTrack 0.0", "rTrack 0.0" ],
        "right": [ "lTrack 0.0", "rTrack 0.0" ],
    }
};

export type KeyBinding = Map<string, string>;