'use client';

import { Player } from "@/player";
import React from "react";
import styles from "./page.module.css";

// TODO: Add `PlayerPanel` each time a new player is created.
export function PlayerPanel({ player }: { player: Player }) {
    return <div className={styles["player-panel"]}>
        <h2 style={{color: player.color.toHex()}}>{player.name}</h2>
    </div>
}

export default function PlayersPanel({ players }: { players: Player[] }) {
    const ret = [];
    for(const player of players) {
        ret.push(PlayerPanel({ player }));
    }
    return <div className={styles["players-panel"]}>{ret}</div>
}