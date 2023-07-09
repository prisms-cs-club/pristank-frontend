'use client';

import { Player } from "@/player";
import React, { useContext, useEffect, useState } from "react";
import styles from "./page.module.css";
import { GameDisplay } from "@/game-display";
import { GameContext } from "./game-scene";

export function PlayerPanel(props: { player: Player }) {
    const [state, setState] = useState(props.player.state);
    useEffect(() => {
        props.player.setState = setState;
    }, [props.player]);
    return (
        <div className={styles["card"]}>
            <h2 style={{color: props.player.color.toHex()}}>{props.player.name}</h2>
            <ul>
                {Object.entries(state).map((value, index) => <li key={index}>{value[0]}: {value[1]}</li>)}
            </ul>
        </div>
    )
}

export function PlayersPanel() {
    const game = useContext(GameContext);
    const [players, setPlayers] = useState(game!!.players);
    useEffect(() => {
        if(game != undefined) {
            game.setPlayers = (players: Player[]) => {
                console.log(players);
                setPlayers(players);
            };
        }
    }, [game]);
    return (
        <div className={styles["players-panel"]}>{
            players.map(player => <PlayerPanel key={player.name} player={player}></PlayerPanel>)
        }</div>
    );
}