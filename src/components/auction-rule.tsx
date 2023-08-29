import styles from "@/app/page.module.css";
import { AuctionRule } from "@/market";
import { useEffect, useRef, useState } from "react";
import { GameDisplay, PlayerMode } from "@/game-display";

export default function AuctionRulePanel({rule, game}: { rule: AuctionRule, game: GameDisplay }) {
    const [selling, setSelling] = useState<string | undefined>();
    const [price, setPrice] = useState<number>(0);
    const [duration, setDuration] = useState<number | undefined>();
    const [lastBidder, setLastBidder] = useState<number | undefined>();
    const [bid, setBid] = useState<number>(price);                // Only for real-time mode where user can bid
    useEffect(() => {
        rule.setSelling = setSelling;
        rule.setMinBid = setPrice;
        rule.setDuration = setDuration;
        rule.setLastBidder = setLastBidder;
        // TODO: text color of player name
    }, [rule]);
    const auctionRule =  (
        <div>
            {(selling != undefined)? (
                <div>
                    <p>Now <strong>&quot;{selling}&quot;</strong> is in auction</p>
                    <p>Minimum price / last price: <strong>{price}</strong></p>
                    <p>The auction ends in {duration} seconds.</p>
                    {lastBidder && <p>Last bidder: <strong color={game.getPlayerColor(lastBidder)}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong></p>}
                </div>
            ): (
                <div>
                    <p>Auction finished.</p>
                    {lastBidder &&
                        <p>Last upgrade is bought by <strong color={game.getPlayerColor(lastBidder)}>{game.getPlayer(lastBidder)?.name ?? "_____"}</strong> with price <strong>{price}</strong>.</p>}
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
                    max={game.options.mode.myPlayer!!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    disabled={game.options.mode.myPlayer!!.money < price} />
                <label>{game.options.mode.myPlayer!!.money}</label>
                <br/>
                <label>Your bid: </label>
                <input type="number" style={{width: "auto"}}
                    min={price + 1}
                    max={game.options.mode.myPlayer!!.money}
                    value={bid}
                    onChange={e => setBid(parseInt(e.target.value))}
                    onKeyDown={e => {  // handle enter key
                        if(e.key == "Enter") { rule.bid(game, bid) }
                    }}
                    disabled={game.options.mode.myPlayer!!.money < price} />
                <button onClick={() => rule.bid(game, bid)}>Bid</button>
            </div> )}
        </div>
    )
}