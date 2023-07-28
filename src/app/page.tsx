'use client';

import styles from './page.module.css'
import LoadingScene from '@/components/loading-scene';
import GameScene from '@/components/game-scene';
import { LoadOptions, LoadRealTime, LoadReplay, LoadObserver, load } from '@/boot';
import { useState } from 'react';
import { GameDisplay } from '@/game-display';
import { Tasker } from '@/utils/tasker';
import { Metadata } from 'next';

const mode
//     : LoadReplay = {
//     kind: "Replay",
//     file: "/demo/replay-demo.json",
// };
    : LoadRealTime = {
    kind: "RealTime",
    addr: "ws://localhost:1145",
}

export default function Home() {
    const options = new LoadOptions(mode);
    const [game, setGame] = useState<GameDisplay>();
    const [tasker, setTasker] = useState<Tasker>(load(options));
    return (
        <main>
            { game?
                <GameScene game={game}></GameScene>:
                <LoadingScene tasker={tasker} allComplete={setGame}></LoadingScene>
            }
        </main>
    )
}
