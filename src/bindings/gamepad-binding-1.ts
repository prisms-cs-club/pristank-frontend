import { GamepadBinding } from "@/input";

export const LEFT_TRACK_AXIS = 1;
export const RIGHT_TRACK_AXIS = 3;
export const FIRE_BUTTON = 0;

export const gamepadBinding: GamepadBinding = (gamepad, player) => {
    // Mode 1:
    // two vertical axes controls the track speeds
    // button A controls firing
    const lTrackSpd = player.tankSpeed * gamepad.axes[LEFT_TRACK_AXIS].valueOf();
    const rTrackSpd = player.tankSpeed * gamepad.axes[RIGHT_TRACK_AXIS].valueOf();
    const commands = [
        `lTrack ${lTrackSpd}`,
        `rTrack ${rTrackSpd}`,
    ];
    if(gamepad.buttons[FIRE_BUTTON].pressed) {
        commands.push("fire");
    }
    return commands;
}