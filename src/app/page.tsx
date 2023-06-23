'use client';

import styles from './page.module.css'
import LoadingScene from './loading-scene';
import GameScene from './game-scene';
import { LoadOptions, load } from '@/boot';
import { ReactElement, useEffect, useState } from 'react';
import { GameDisplay } from '@/game-display';

export default function Home() {
    const [game, setGame] = useState<GameDisplay>();

    useEffect(() => {
        const options = new LoadOptions();
        options.replay = "/demo/replay-demo.json";
        // options.socketAddr = "ws://localhost:8080";
        (async () => {
            setGame(await load(options));
        })();
    }, []);
    return (
        <main>
            { game? <GameScene game={game}></GameScene>: <LoadingScene></LoadingScene> }
        </main>
    )
}
