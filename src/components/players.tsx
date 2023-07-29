'use client';

import { PlayerElement, PlayerState } from "@/player";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import { GameDisplay } from "@/game-display";
import { GameContext } from "./game-scene";

export function PlayerPanel(props: { player: PlayerElement }) {
    const player = useRef(props.player);
    const [state, setState] = useState<PlayerState>(player.current.state);
    useEffect(() => {
        player.current.state = state;
        player.current.setState = setState;
    }, [player, state]);
    return (
        <div>
            <h2 style={{color: player.current.color.toHex()}}>{player.current.name}</h2>
            <ul style={{listStyleType: "none"}}>
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
            game.setPlayers = setPlayers;
        }
    }, [game]);
    return (
            (players.length > 0)
                ? <div className={styles["card"]}>
                    {players.map(player => <PlayerPanel key={player.name} player={player}></PlayerPanel>)}
                  </div>
                : null
    );
}