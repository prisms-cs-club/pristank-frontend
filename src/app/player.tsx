import { Player } from "@/player";
import React from "react";
import styles from "./page.module.css";

type PlayerProps = {
    player: Player;
};

// TODO: Add `PlayerPanel` each time a new player is created.
export default function PlayerPanel(props: PlayerProps) {
    const player = props.player;
    return <div className={styles["player-panel"]}>
        <h2 style={{color: player.color.toHex()}}>{player.name}</h2>
    </div>
}