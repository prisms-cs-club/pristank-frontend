import { GameDisplay } from '@/game-display';
import PlayersPanel from './player';
import ErrorPanel from './error';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function GameScene({ game }: { game: GameDisplay }) {
    const [error, setError] = useState<string[]>();

    useEffect(() => {
        (game.app.view as unknown as HTMLElement).classList.add(styles["game-canvas"])  // TODO: unsafe
        document.getElementsByClassName(styles["game-container"])[0].appendChild(game.app.view as unknown as HTMLElement);
        game.errorCallback = setError;
        game.start();
    }, [game]);
    return <div className={styles["game-container"]}>
        <PlayersPanel players={game.players}></PlayersPanel>
        { error && <ErrorPanel messages={error}></ErrorPanel> }
    </div>
}