import { Game } from "@/game-display";
import { KeyBinding, KeyMap } from "@/input";
import { PlayerElement } from "@/player";

export const keyBinding: KeyBinding = (keymap: KeyMap, game: Game, player: PlayerElement) => {
    keymap.addKeyDownHandler("Space", () => ["fire"]);
}