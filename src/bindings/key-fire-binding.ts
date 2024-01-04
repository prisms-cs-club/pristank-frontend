import { Game } from "@/game";
import { KeyBinding, KeyMap } from "@/input";
import { PlayerElement } from "@/player";

export const keyBinding: KeyBinding = (keymap: KeyMap, player: PlayerElement) => {
    keymap.addKeyDownHandler("Space", () => ["fire"]);
}