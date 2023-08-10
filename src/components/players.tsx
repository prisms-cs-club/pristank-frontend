'use client';

import { PlayerElement, PlayerState } from "@/player";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import { GameContext } from "./game-scene";

export function PlayerPanel(props: { player: PlayerElement }) {
    const player = useRef(props.player);
    const [state, setState] = useState<PlayerState>(player.current.getState());
    useEffect(() => {
        player.current.setState = setState;
    }, [player, state]);
    return (
        <div>
            <h2 style={{color: player.current.color.toHex()}}>{player.current.name}</h2>
            <ul style={{listStyleType: "none"}}>
                {Object.entries(state).map((value, index) => {
                    if(value[0] != "hp" && value[0] != "maxHp") {
                        return <li key={index}>{value[0]}: {value[1]}</li>
                    } else if(value[0] == "hp") {
                        // display HP and maximum HP together
                        return <li key={index}>{value[0]}: {value[1]} / {state.maxHp}</li>
                    } else {
                        return null;
                    }
                })}
            </ul>
        </div>
    )
}

export function PlayersPanel() {
    const game = useContext(GameContext);
    const [players, setPlayers] = useState(Array.from(game!!.players.values()));
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