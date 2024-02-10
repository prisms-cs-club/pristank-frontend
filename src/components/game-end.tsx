import styles from "@/app/page.module.css";
import { useContext } from "react";
import { GameContext } from "./game-scene";
import { EndEvent } from "@/event";
import { assertDef } from "@/utils/other";
import { GameUI } from "@/game-ui";

export default function GameEndPanel({parent, endEvent}: { parent: GameUI, endEvent: EndEvent }) {
    const winner = parent!.getPlayer(assertDef(endEvent.uids[0], "There must be at least one player in the rank"))!!;
    return <div className={styles["center-screen"] + " " + styles["card"]} style={{backgroundColor: "rgba(145, 145, 145, 0.9)"}}>
        <strong style={{fontSize: '2.5em'}}>player <span style={{color: winner.color.toHex()}}>{winner.name}</span> wins</strong>
        <h3>RANK</h3>
        <table className={styles["centering"]}>
            {endEvent.uids.map((uid, index) => {
                return <tr key={index}>
                    <td>{(endEvent.rank != undefined)? endEvent.rank[index]: index + 1}.</td>
                    <td style={{color: parent?.getPlayer(uid)?.color.toHex()}}>{parent!.getPlayer(uid)!.name}</td>
                </tr>;
            })}
        </table>
    </div>
}