import { GamepadBinding } from "@/input";
import { AuctionRule } from "@/market";

export const BID_DECREASE_BUTTON = 14;
export const BID_INCREASE_BUTTON = 15;
export const BID_BUTTON = 1;

export default function gamepadBinding(rule: AuctionRule): GamepadBinding {
    return (gamepad, player) => {
        let newBid = rule.myBid;
        if(gamepad.buttons[BID_INCREASE_BUTTON].pressed && newBid < player.money) {
            newBid += 1;
        }
        if(gamepad.buttons[BID_DECREASE_BUTTON].pressed && newBid > rule.minBid + 1) {
            newBid -= 1;
        }
        if(newBid !== rule.myBid) {
            rule.setBid(newBid);
        }
        if(gamepad.buttons[BID_BUTTON].pressed) {
            return [`market.bid ${rule.myBid}`];
        }
        return [];
    }
}