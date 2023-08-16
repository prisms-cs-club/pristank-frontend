'use client';

import LoadingScene from '@/components/loading-scene';
import GameScene from '@/components/game-scene';
import { LoadOptions, LoadRealTime, LoadReplay, load } from '@/boot';
import { useEffect, useRef, useState } from 'react';
import { GameDisplay } from '@/game-display';
import { Tasker } from '@/utils/tasker';

const mode
    : LoadReplay = {
    kind: "Replay",
    file: "/demo/replay-demo.json",
};
//     : LoadRealTime = {
//     kind: "RealTime",
//     host: "localhost",
// };

const options: LoadOptions = {
    socketTimeout: 10000, // (miliseconds)
    mode: mode,
    displayHP: true,
    displayVisionCirc: true,
    displayDebugStr: true,
};

export default function Home() {
    const [game, setGame] = useState<GameDisplay>();
    const [tasker, _] = useState<Tasker>(load(options));
    return (
        <main>
            { game?
                <GameScene game={game}></GameScene>:
                <LoadingScene tasker={tasker} allComplete={setGame}></LoadingScene>
            }
        </main>
    );
}
