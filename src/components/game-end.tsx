import styles from "@/app/page.module.css";
import { useContext } from "react";
import { GameContext } from "./game-scene";
import { EndEvent } from "@/event";
import { assertDef } from "@/utils/other";

export default function GameEndPanel({endEvent}: {endEvent: EndEvent}) {
    const game = useContext(GameContext);
    const winner = game!!.getPlayer(assertDef(endEvent.rank[0], "There must be at least one player in the rank"))!!;
    return <div className={styles["center-screen"] + " " + styles["card"]} style={{backgroundColor: "rgba(145, 145, 145, 0.9)"}}>
        <strong style={{fontSize: '2.5em'}}>player <span style={{color: winner.color.toHex()}}>{winner.name}</span> wins</strong>
        <h3>RANK</h3>
        <table className={styles["centering"]}>
            {endEvent.rank.map((value, index) => {
                return <tr key={index}>
                    <td>{index + 1}.</td>
                    <td style={{color: game?.getPlayer(value)?.color.toHex()}}>{game!!.getPlayer(value)!!.name}</td>
                </tr>;
            })}
        </table>
    </div>
}