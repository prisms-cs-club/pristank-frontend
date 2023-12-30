import styles from "@/app/page.module.css";
import { AuctionRule } from "@/market";
import { useEffect, useRef, useState } from "react";
import { Game, PlayerMode } from "@/game-display";

export default function AuctionRulePanel({rule, game}: { rule: AuctionRule, game: Game }) {
    const [selling, setSelling] = useState<string | undefined>();
    const [price, setPrice] = useState<number>(0);
    const [duration, setDuration] = useState<number | undefined>();
    const [lastBidder, setLastBidder] = useState<number | undefined>();
    const [bid, setBid] = useState<number>(price);                // Only for real-time mode where user can bid
    useEffect(() => {
        rule.setSelling = setSelling;
        rule.setDuration = setDuration;
        rule.setLastBidder = setLastBidder;
        rule.setBid = setBid;
    }, [rule]);
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
    const auctionRule =  (
        <div>
            {(selling != undefined)? (
                <div>
                    <p>Now <strong>&quot;{selling}&quot;</strong> is in auction</p>
                    <p>Minimum price / last price: <strong>{price}</strong></p>
                    <p>The auction ends in {duration} seconds.</p>
                    {lastBidder && <p>Last bidder: <strong style={{color: game.getPlayerColor(lastBidder)}}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong></p>}
                </div>
            ): (
                <div>
                    <p>Auction finished.</p>
                    {lastBidder &&
                        <p>Last upgrade is bought by <strong style={{color: game.getPlayerColor(lastBidder)}}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong> with price <strong>{price}</strong>.</p>}
                    {(duration != undefined)? (
                        <p>Next auction will start in {duration} seconds.</p>
                    ): (
                        <p>Next auction will start soon.</p>
                    )}
                </div>
            )}
        </div>
    );
    if(game.options.mode.kind != "RealTime") {
        return auctionRule;
    }
    return (
        <div>
            {auctionRule}
            {selling != undefined && (<div>
                <label>{price + 1}</label>
                <input type="range"
                    min={price + 1}
                    max={game.options.mode.myPlayer!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    disabled={game.options.mode.myPlayer!!.money < price} />
                <label>{game.options.mode.myPlayer!!.money}</label>
                <br/>
                <label>Your bid: </label>
                <input type="number" style={{width: "auto"}}
                    min={price + 1}
                    max={game.options.mode.myPlayer!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    onKeyDown={e => {  // handle enter key
                        if(e.key == "Enter") { rule.doBid(game, bid) }
                    }}
                    disabled={game.options.mode.myPlayer!!.money < price} />
                <button onClick={() => rule.doBid(game, bid)}>Bid</button>
            </div> )}
        </div>
    )
}