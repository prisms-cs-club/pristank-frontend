import ReactDOM from "react-dom/client";
import AuctionRulePanel from "./components/auction-rule";
import { Game } from "./game";
import { EventEntry } from "./event";
import { GamepadBinding, KeyBinding } from "./input";
import { sendCommand } from "./utils/socket";
import auctionKeyBinding from "./bindings/key-auction-binding";
import auctionGamepadBinding from "./bindings/gamepad-auction-binding";
import { GameUI } from "./game-ui";

export interface PricingRule {
    /**
     * name of the pricing rule
     */
    name: string;

    keyBinding?: KeyBinding;
    gamepadBinding?: GamepadBinding;

    /**
     * Initialize the pricing rule. This includes set up the UI and other necessary initializations.
     * @param game The game
     */
    init: (game: GameUI) => void;

    /**
     * Process an incoming `Market Update` event based on the pricing rule.
     * @param game The game
     * @param event The event to be processed
     */
    processEvent: (game: GameUI, event: EventEntry) => void;
};

/**
 * No market rule.
 */
export class NoneRule implements PricingRule {
    name = "None";
    init() {}
    processEvent() {}
}

/**
 * Auction rule:
 * - The game will select random upgrades to sell.
 * - Player who give the largest bid will get the upgrade.
 */
export class AuctionRule implements PricingRule {
    name = "Auction";

    minBid: number = 0;
    myBid: number = 0;

    setSelling!: (selling: string | undefined) => void;
    setBid!: (bid: number) => void;
    setMinBid!: (minBid: number) => void;
    setNextEventTime!: (nextTime: number) => void;
    setLastBidder!: (bidder: number | undefined) => void;

    keyBinding = auctionKeyBinding(this);
    gamepadBinding = auctionGamepadBinding(this);

    init(game: GameUI) {
        const root = ReactDOM.createRoot(document.getElementById("pricing-rule")!);
        root.render(
            <AuctionRulePanel rule={this} game={game}></AuctionRulePanel>
        );
    }

    processEvent(game: GameUI, event: EventEntry) {
        console.log(event);
        // The market update event of auction rule can be in 3 different forms:
        if(event.toSell != undefined) {
            // start of auction
            let toSellStr = "";
            if(event.toSell[1] == true || event.toSell[1] == 1) {
                toSellStr = event.toSell[0] + " " + ((event.toSell[2] > 0)? '+': "") + `${event.toSell[2]}`;
            } else {
                toSellStr = event.toSell[0] + " =" + event.toSell[2];
            }
            this.setSelling(toSellStr);
            this.setMinBid(event.minBid!!);
            this.setLastBidder(undefined);
            if(event.endT !== undefined) {
                this.setNextEventTime(event.endT);
            }
        } else if(event.bidder != undefined) {
            // middle of auction
            this.setLastBidder(event.bidder!!);
            if(event.price != undefined) {
                this.setMinBid(event.price);
            }
        } else {
            // end of auction
            this.setSelling(undefined);
            this.setLastBidder(event.buyer!!);
            this.setMinBid(event.price!!);
            if(event.nextT != undefined) {
                this.setNextEventTime(event.nextT);
            }
        }
    }

    /**
     * Handle bidding request from user.
     * @param game The game
     * @param amount The amount of money to bid
     */
    doBid(game: Game, amount: number) {
        if(game.mode.kind == "RealTime") {
            sendCommand(`market.bid ${amount}`, game.mode.socket, game.timer);
        }
    }
}

/**
 * All the pricing rules in a list.
 */
export const PRICING_RULES: { [key: string]: PricingRule } = {
    none: new NoneRule,
    auction: new AuctionRule,
}