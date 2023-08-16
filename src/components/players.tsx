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
            <hr />
            <h2 style={{color: player.current.alive? player.current.color.toHex(): "gray"}}>{player.current.name}</h2>
            { player.current.alive &&
                <ul style={{listStyleType: "none"}}>
                    {Object.entries(state)
                        .filter(value => value[0] != "maxHp" && value[0] != "debugString" && value[0] != "alive")
                        .map((value, index) => {
                            if(value[0] != "hp") {
                                return <li key={index}>{value[0]}: {value[1]}</li>
                            } else {
                                // display HP and maximum HP together
                                return <li key={index}>{value[0]}: {value[1]} / {state.maxHp}</li>
                            }
                        })
                    }
                    {(state.debugString != undefined && player.current.gameIn.options.displayDebugStr) ? <li><span className={styles["debug-string"]}>{state.debugString}</span></li> : null}
                </ul>
            }
            <hr />
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