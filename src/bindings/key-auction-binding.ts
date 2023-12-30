import { Game } from "@/game-display";
import { KeyBinding, KeyMap } from "@/input";
import { AuctionRule } from "@/market";
import { PlayerElement } from "@/player";

export default function keyBinding(rule: AuctionRule): KeyBinding {
    return (keymap: KeyMap, player: PlayerElement) => {
        keymap.addKeyDownHandler("ArrowLeft", () => {
            if(rule.myBid > rule.minBid + 1) {
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