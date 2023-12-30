import { Game } from "@/game-display";
import { KeyBinding, KeyMap } from "@/input";
import { PlayerElement } from "@/player";

export const keyBinding: KeyBinding = (keymap: KeyMap, game: Game, player: PlayerElement) => {
    var keyPressedState = [false, false, false, false]; // up, left, down, right
    function getMovementFromState() {
        let vl: number = 0;
        let vr: number = 0;
        if(keyPressedState[0]) {
            vl += 1.0;
            vr += 1.0;
        }
        if(keyPressedState[1]) {
            vl -= 1.0;
            vr += 1.0;
        }
        if(keyPressedState[2]) {
            vl -= 1.0;
            vr -= 1.0;
        }
        if(keyPressedState[3]) {
            vl += 1.0;
            vr -= 1.0;
        }
        return [
            `lTrack ${Math.min(Math.max(vl, -1), 1) * player.tankSpeed}`,
            `rTrack ${Math.min(Math.max(vr, -1), 1) * player.tankSpeed}`,
        ]
    }
    keymap.addKeyDownHandler("KeyW", () => {
        keyPressedState[0] = true;
        return getMovementFromState();
    });
    keymap.addKeyUpHandler("KeyW", () => {
        keyPressedState[0] = false;
        return getMovementFromState();
    });

    keymap.addKeyDownHandler("KeyA", () => {
        keyPressedState[1] = true;
        return getMovementFromState();
    });
    keymap.addKeyUpHandler("KeyA", () => {
        keyPressedState[1] = false;
        return getMovementFromState();
    });
    
    keymap.addKeyDownHandler("KeyS", () => {
        keyPressedState[2] = true;
        return getMovementFromState();
    });
    keymap.addKeyUpHandler("KeyS", () => {
        keyPressedState[2] = false;
        return getMovementFromState();
    });

    
    keymap.addKeyDownHandler("KeyD", () => {
        keyPressedState[3] = true;
        return getMovementFromState();
    });
    keymap.addKeyUpHandler("KeyD", () => {
        keyPressedState[3] = false;
        return getMovementFromState();
    });
}