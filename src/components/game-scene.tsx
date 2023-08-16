'use client';

import { GameDisplay } from '@/game-display';
import { PlayersPanel } from './players';
import ErrorPanel from './error';
import { useEffect, createContext, useState } from 'react';
import styles from '@/app/page.module.css';
import { EndEvent } from '@/event';
import GameEndPanel from './game-end';

export const GameContext = createContext<GameDisplay | undefined>(undefined);
export const ErrorContext = createContext<string[] | undefined>(undefined);

export default function GameScene({ game }: { game: GameDisplay }) {
    const [error, setError] = useState<string[]>();
    const [gameEnd, setGameEnd] = useState<EndEvent>();
    useEffect(() => {
        (game.app.view as unknown as HTMLElement).classList.add(styles["game-canvas"])  // TODO: unsafe
        document.getElementsByClassName(styles["game-container"])[0].appendChild(game.app.view as unknown as HTMLElement);
        game.errorCallback = setError;
        game.gameEndCallback = setGameEnd;
        game.start();
        game.options.pricingRule.init(game);  // init pricing rules
        // Other initializations of the game related to graphics should be put here.
    }, [game]);
    return <div id="root" className={styles["game-container"]}>
        <GameContext.Provider value={game}>
            <div className={styles["left-panel"]}>
                <PlayersPanel></PlayersPanel>
            </div>
            <ErrorContext.Provider value={error}> 
                { error && <ErrorPanel></ErrorPanel> }
            </ErrorContext.Provider>
            { gameEnd && <GameEndPanel endEvent={gameEnd}></GameEndPanel> }
            <div className={styles["right-panel"]}>
                <div className={styles["card"]}>
                    <h2>Rule: {game.options.pricingRule.name}</h2>
                </div>
                <div className={styles["card"]} id="pricing-rule"></div>
            </div>
        </GameContext.Provider>
    </div>
}