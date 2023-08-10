import styles from "@/app/page.module.css";
import { AuctionRule } from "@/market";
import { useEffect, useState } from "react";
import { GameDisplay } from "@/game-display";

export default function AuctionRulePanel({rule, game}: { rule: AuctionRule, game: GameDisplay }) {
    const [selling, setSelling] = useState<string | undefined>();
    const [price, setPrice] = useState<number>(0);
    const [duration, setDuration] = useState<number | undefined>();
    const [lastBidder, setLastBidder] = useState<number | undefined>();
    useEffect(() => {
        rule.setSelling = setSelling;
        rule.setMinBid = setPrice;
        rule.setDuration = setDuration;
        rule.setLastBidder = setLastBidder;
        // TODO: text color of player name
    }, [rule]);
    return (
        <div>
            {(selling != undefined)? (
                <div>
                    <p>Now <strong>&quot;{selling}&quot;</strong> is in auction</p>
                    <p>Minimum price / last price: <strong>{price}</strong></p>
                    <p>The auction ends in {duration} seconds.</p>
                    {(lastBidder != undefined)? <p>Last bidder: <strong color={game.getPlayerColor(lastBidder)}>{game.players.get(lastBidder)!!.name}</strong></p>: null}
                </div>
            ): (
                <div>
                    <p>Auction finished.</p>
                    {(lastBidder != undefined)?
                        <p>Last upgrade is bought by <strong color={game.getPlayerColor(lastBidder)}>{game.players.get(lastBidder)!!.name}</strong> with price <strong>{price}</strong>.</p>:
                        null}
                    {(duration != undefined)? (
                        <p>Next auction will start in {duration} seconds.</p>
                    ): (
                        <p>Next auction will start soon.</p>
                    )}
                </div>
            )}
        </div>
    )
}