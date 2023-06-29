'use client';

import styles from './page.module.css'
import LoadingScene from './loading-scene';
import GameScene from './game-scene';
import { LoadOptions, load } from '@/boot';
import { useEffect, useState } from 'react';
import { GameDisplay } from '@/game-display';
import { Tasker } from '@/utils/tasker';

export default function Home() {
    const [game, setGame] = useState<GameDisplay>();
    const [tasker, setTasker] = useState<Tasker>();
    useEffect(() => {
        const options = new LoadOptions(window.innerWidth, window.innerHeight);
        options.socketAddr = "ws://localhost:8080";
        // options.replay = "/demo/replay-demo.json";
        setTasker(load(options)!!);
    }, []);
    return (
        <main>
            { game?
                <GameScene game={game}></GameScene>:
                (tasker? <LoadingScene tasker={tasker} allComplete={setGame}></LoadingScene>: <div></div>)
            }
        </main>
    )
}
