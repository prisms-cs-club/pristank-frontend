'use client';

import { PlayerElement, PlayerState } from "@/player";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import { GameContext } from "./game-scene";
import PropIcon from "./icon";

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
                <table border={0} style={{width: '100%'}}>
                    {Object.entries(state)
                        .filter(value => value[0] != "maxHp" && value[0] != "debugString" && value[0] != "alive")
                        .map((value, index) => {
                            if(value[0] != "hp") {
                                return <tr key={index}>
                                    <td><PropIcon name={value[0]} /></td>
                                    <td>{value[1]}</td>
                                    </tr>
                            } else {
                                // display HP and maximum HP together
                                return <tr key={index}>
                                    <td><PropIcon name={value[0]} /></td>
                                    <td>{value[1]} / {state.maxHp}</td>
                                    </tr>
                            }
                        })
                    }
                    {(state.debugString != undefined && player.current.gameIn.options.displayDebugStr) ?
                        <tr><td colSpan={2}><span className={styles["debug-string"]}>{state.debugString}</span></td></tr> :
                        null}
                </table>
            }
            <hr />
        </div>
    )
}

export function PlayersPanel() {
    const game = useContext(GameContext);
    const [players, setPlayers] = useState(Array.from(game!!.players.values()));
    useEffect(() => {
        if(game !== undefined) {
            game.setDisplayedPlayers = setPlayers;
        }
    }, [game]);
    useEffect(() => {
        if(game !== undefined) {
            game.displayedPlayers = players;
        }
    }, [game, players]);
    return (
            (players.length > 0)
                ? <div className={styles["card"]}>
                    {players.map(player => <PlayerPanel key={player.name} player={player}></PlayerPanel>)}
                  </div>
                : null
    );
}