import styles from "@/app/page.module.css";
import { AuctionRule } from "@/market";
import { useEffect, useRef, useState } from "react";
import { GameUI } from "@/game-ui";
import { Game } from "@/game";

export default function AuctionRulePanel({rule, game}: { rule: AuctionRule, game: GameUI }) {
    const [selling, setSelling] = useState<string | undefined>();
    const [price, setPrice] = useState<number>(0);
    const [nextTime, setNextEventTime] = useState<number | undefined>();
    const [curTime, setCurTime] = useState<number>(game.timer);
    const [lastBidder, setLastBidder] = useState<number | undefined>();
    const [bid, setBid] = useState<number>(price);                // Only for real-time mode where user can bid
    useEffect(() => {
        rule.setSelling = setSelling;
        rule.setNextEventTime = setNextEventTime;
        rule.setLastBidder = setLastBidder;
        rule.setBid = setBid;
    }, [rule]);
    useEffect(() => {
        game.timerCallbacks.push(setCurTime);
    }, [game]);
    useEffect(() => {
        // synchronize the `price` state in this component with the `minBid` property
        // in the `rule` object.
        rule.minBid = price;
    }, [rule, price]);
    useEffect(() => {
        rule.setMinBid = (number) => {
            setPrice(number);
            if(bid < number) {
                setBid(number);
            }
        };
        rule.myBid = bid;
    }, [rule, bid]);
    // display the auction information: current price, last bidder, etc.
    const auctionRule =  (
        <div>
            {(selling != undefined)? (
                <div>
                    <p>Now <strong>&quot;{selling}&quot;</strong> is in auction</p>
                    <p>Minimum price / last price: <strong>{price}</strong></p>
                    <p>The auction ends in {Math.round((nextTime! - game.timer) / 1000)} seconds.</p>
                    {lastBidder && <p>Last bidder: <strong style={{color: game.getPlayerColor(lastBidder)}}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong></p>}
                </div>
            ): (
                <div>
                    <p>Auction finished.</p>
                    {lastBidder &&
                        <p>Last upgrade is bought by <strong style={{color: game.getPlayerColor(lastBidder)}}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong> with price <strong>{price}</strong>.</p>}
                    {(nextTime != undefined)? (
                        <p>Next auction will start in {Math.round((nextTime! - curTime) / 1000)} seconds.</p>
                        // TODO Bug: it is not refreshing every second
                    ): (
                        <p>Next auction will start soon.</p>
                    )}
                </div>
            )}
        </div>
    );
    if(!(game instanceof Game) || game.mode.kind != "RealTime") {
        return auctionRule;
    }
    // display control panel that allows user to bid
    return (
        <div>
            {auctionRule}
            {selling != undefined && (<div>
                <label>{price + 1}</label>
                <input type="range"
                    min={price + 1}
                    max={game.mode.myPlayer!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    disabled={game.mode.myPlayer!.money < price} />
                <label>{game.mode.myPlayer!.money}</label>
                <br/>
                <label>Your bid: </label>
                <input type="number" style={{width: "auto"}}
                    min={price + 1}
                    max={game.mode.myPlayer!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    onKeyDown={e => {  // handle enter key
                        if(e.key == "Enter") { rule.doBid(game, bid) }
                    }}
                    disabled={game.mode.myPlayer!.money < price} />
                <button onClick={() => rule.doBid(game, bid)}>Bid</button>
            </div> )}
        </div>
    )
}