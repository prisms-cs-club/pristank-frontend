import { GamepadBinding } from "@/input";

export const LEFT_TRACK_DIR_BUTTON = 4;
export const RIGHT_TRACK_DIR_BUTTON = 5;
export const LEFT_TRACK_SPD_BUTTON = 6;
export const RIGHT_TRACK_SPD_BUTTON = 7;
export const FIRE_BUTTON = 0;

export const gamepadBinding: GamepadBinding = (gamepad, game, player) => {
    // Mode 1:
    // two bumpers control the direction of the two tracks
    // two triggers control the speed of the two tracks
    // button 0 controls firing
    const lTrackDir = (gamepad.buttons[LEFT_TRACK_DIR_BUTTON].pressed? -1: 1);
    const rTrackDir = (gamepad.buttons[RIGHT_TRACK_DIR_BUTTON].pressed? -1: 1);
    const lTrackSpd = player.tankSpeed * lTrackDir * gamepad.buttons[LEFT_TRACK_SPD_BUTTON].value;
    const rTrackSpd = player.tankSpeed * rTrackDir * gamepad.buttons[RIGHT_TRACK_SPD_BUTTON].value;
    const commands = [
        `lTrack ${lTrackSpd}`,
        `rTrack ${rTrackSpd}`,
    ];
    if(gamepad.buttons[FIRE_BUTTON].pressed) {
        commands.push("fire");
    }
    return commands;
}