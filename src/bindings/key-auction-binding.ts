import { Game } from "@/game-display";
import { KeyBinding, KeyMap } from "@/input";
import { AuctionRule } from "@/market";
import { PlayerElement } from "@/player";

export default function keyBinding(rule: AuctionRule) {
    return (keymap: KeyMap, game: Game, player: PlayerElement) => {
        keymap.addKeyDownHandler("ArrowLeft", () => {
            if(rule.myBid > rule.minBid) {
                rule.setBid(rule.myBid - 1);
            }
            return [];
        });
        keymap.addKeyDownHandler("ArrowRight", () => {
            if(rule.myBid < player.money) {
                rule.setBid(rule.myBid + 1);
            }
            return [];
        });
        keymap.addKeyDownHandler("Enter", () => {
            return [`market.bid ${rule.myBid}`];
        });
    };
}