import ReactDOM from "react-dom/client";
import AuctionRulePanel from "./components/auction-rule";
import { GameDisplay } from "./game-display";
import { EventEntry } from "./event";

/**
 * This timer function is used to display the time left for auction.
 * It will call the callback function every second.
 * @param millis milliseconds until timer ends
 * @param callback callback function to call every second
 */
function timer(millis: number, callback: (secs: number) => void) {
    const lowestSecs = Math.floor(millis / 1000);
    callback(lowestSecs + 1);
    setTimeout(() => {
        let secsCopy = lowestSecs;
        callback(secsCopy);
        const interval = setInterval(() => {
            secsCopy -= 1;
            callback(secsCopy);
            if(secsCopy <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }, millis - lowestSecs * 1000);
}

export interface PricingRule {
    /**
     * name of the pricing rule
     */
    name: string;

    /**
     * Initialize the pricing rule. This includes set up the UI and other necessary initializations.
     * @param game The game
     */
    init: (game: GameDisplay) => void;

    /**
     * Process an incoming `Market Update` event based on the pricing rule.
     * @param game The game
     * @param event The event to be processed
     */
    processEvent: (game: GameDisplay, event: EventEntry) => void;
};

export class NoneRule implements PricingRule {
    name = "None";
    init(game: GameDisplay) {}
    processEvent(game: GameDisplay, event: EventEntry) {}
}

export class AuctionRule implements PricingRule {
    name = "Auction";
    setSelling!: (selling: string | undefined) => void;
    setMinBid!: (minBid: number) => void;
    setDuration!: (duration: number | undefined) => void;            // This `duration` is in seconds.
    setLastBidder!: (bidder: number | undefined) => void;

    init(game: GameDisplay) {
        const root = ReactDOM.createRoot(document.getElementById("pricing-rule")!);
        root.render(
            <AuctionRulePanel rule={this} game={game}></AuctionRulePanel>
        );
    }
    processEvent(game: GameDisplay, event: EventEntry) {
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
            timer(event.endT - game.timer, this.setDuration);
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
                timer(event.nextT - game.timer, this.setDuration);
            }
        }
    }

    /**
     * Handle bidding request from user.
     * @param game The game
     * @param amount The amount of money to bid
     */
    bid(game: GameDisplay, amount: number) {
        if(game.options.mode.kind == "RealTime") {
            game.options.mode.socket.send(`${game.timer} market.bid ${amount}`)
        }
    }
}

export const PRICING_RULES: { [key: string]: PricingRule } = {
    none: new NoneRule,
    auction: new AuctionRule,
}