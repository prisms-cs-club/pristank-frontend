import { GamepadBinding } from "@/input";

export const DIR_X_AXIS = 0;
export const DIR_Y_AXIS = 1;
export const SPEED_BUTTON = 6;
export const FIRE_BUTTON = 0;

export const gamepadBinding: GamepadBinding = (gamepad, game, player) => {
    // Mode 2:
    // two axes controls the direction of the tank
    // one button controls the speed of the tank
    function axesCurve(x: number) {
        return Math.sign(x) * Math.sqrt(Math.abs(x));
    }
    const dirX = gamepad.axes[DIR_X_AXIS].valueOf();
    const dirY = gamepad.axes[DIR_Y_AXIS].valueOf();
    const speed = gamepad.buttons[SPEED_BUTTON].value;
    const leftTrackMul = axesCurve((dirX - dirY) * Math.SQRT1_2);
    const rightTrackMul = axesCurve((-dirX - dirY) * Math.SQRT1_2);
    console.log(leftTrackMul, rightTrackMul, speed);
    const ans = [
        `lTrack ${leftTrackMul * player.tankSpeed * speed}`,
        `rTrack ${rightTrackMul * player.tankSpeed * speed}`
    ];
    if(gamepad.buttons[FIRE_BUTTON].pressed) {
        ans.push("fire");
    }
    return ans;
}