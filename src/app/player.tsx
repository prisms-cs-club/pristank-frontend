'use client';

import { Player } from "@/player";
import React, { useState } from "react";
import styles from "./page.module.css";

// TODO: Add `PlayerPanel` each time a new player is created.
export function PlayerPanel(props: { player: Player }) {
    const [player, setPlayer] = useState(props.player);
    return <div className={styles["player-panel"]}>
        <h2 style={{color: player.color.toHex()}}>{player.name}</h2>
    </div>
}

export default function PlayersPanel(props: { players: Player[] }) {
    const [players, _] = useState(props.players);
    const ret = [];
    for(const player of players) {
        ret.push(<PlayerPanel key={player.name} player={player}></PlayerPanel>);
    }
    return <div className={styles["players-panel"]}>{ret}</div>
}