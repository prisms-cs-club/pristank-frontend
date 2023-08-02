import ReactDOM from "react-dom/client";
import AuctionRulePanel from "./components/auction-rule";
import { GameDisplay } from "./game-display";
import { EventEntry } from "./event";

function timer(millis: number, callback: (secs: number) => void) {
    const lowestSecs = Math.floor(millis / 1000);
    setTimeout(() => {
        let secsCopy = lowestSecs;
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
    name: string;
    init: (game: GameDisplay) => void;
    processEvent: (event: EventEntry) => void;
};

export class AuctionRule implements PricingRule {
    name = "Auction";
    setSelling!: (selling: string | undefined) => void;
    setMinBid!: (minBid: number) => void;
    setDuration!: (duration: number | undefined) => void;            // This `duration` is in seconds.
    setLastBidder!: (bidder: string | undefined) => void;

    init(game: GameDisplay) {
        ReactDOM.createRoot(document.getElementById("pricing-rule")!).render(
            <AuctionRulePanel rule={this} game={game}></AuctionRulePanel>
        );
    }
    processEvent(event: EventEntry) {
        if(event.toSell != undefined) {
            // start of auction
            const toSellStr = event.toSell[0] + " " + ((event.toSell[1] > 0)? '+': "") + `${event.toSell[1]}`;
            this.setSelling(toSellStr);
            this.setMinBid(event.minBid!!);
            timer(event.duration, this.setDuration);
        } else if(event.bidder != undefined) {
            // middle of auction
            this.setLastBidder(event.bidder);
            if(event.price != undefined) {
                this.setMinBid(event.price);
            }
        } else {
            // end of auction
            this.setSelling(undefined);
            this.setLastBidder(event.buyer!!);
            this.setMinBid(event.price!!);
            if(event.duration != undefined) {
                timer(event.duration, this.setDuration);
            }
        }
    }
}

export const PRICING_RULES: { [key: string]: PricingRule } = {
    auction: new AuctionRule
}