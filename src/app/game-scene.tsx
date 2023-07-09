'use client';

import { GameDisplay } from '@/game-display';
import { PlayersPanel } from './players';
import ErrorPanel from './error';
import { useEffect, createContext, useState } from 'react';
import styles from './page.module.css';

export const GameContext = createContext<GameDisplay | undefined>(undefined);
export const ErrorContext = createContext<string[] | undefined>(undefined);

export default function GameScene({ game }: { game: GameDisplay }) {
    const [error, setError] = useState<string[]>();
    useEffect(() => {
        (game.app.view as unknown as HTMLElement).classList.add(styles["game-canvas"])  // TODO: unsafe
        document.getElementsByClassName(styles["game-container"])[0].appendChild(game.app.view as unknown as HTMLElement);
        game.errorCallback = setError;
        game.start();
    }, [game]);
    return <div id="root" className={styles["game-container"]}>
        <GameContext.Provider value={game}>
            <PlayersPanel></PlayersPanel>
            <ErrorContext.Provider value={error}> 
                { error && <ErrorPanel></ErrorPanel> }
            </ErrorContext.Provider>
        </GameContext.Provider>
    </div>
}