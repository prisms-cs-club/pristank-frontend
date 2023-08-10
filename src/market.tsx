import ReactDOM from "react-dom/client";
import AuctionRulePanel from "./components/auction-rule";
import { GameDisplay } from "./game-display";
import { EventEntry } from "./event";

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
    name: string;
    init: (game: GameDisplay) => void;
    processEvent: (game: GameDisplay, event: EventEntry) => void;
};

export class AuctionRule implements PricingRule {
    name = "Auction";
    setSelling!: (selling: string | undefined) => void;
    setMinBid!: (minBid: number) => void;
    setDuration!: (duration: number | undefined) => void;            // This `duration` is in seconds.
    setLastBidder!: (bidder: number | undefined) => void;

    init(game: GameDisplay) {
        ReactDOM.createRoot(document.getElementById("pricing-rule")!).render(
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
}

export const PRICING_RULES: { [key: string]: PricingRule } = {
    auction: new AuctionRule
}