"use client";

import LoadingScene from "@/components/loading-scene";
import ReplayScene from "@/components/replay-scene";
import { Replay, loadReplay } from "@/replay";
import { useState } from "react";

const fileName = "/demo/replay-demo.json";

export default function Page() {
    const [replay, setReplay] = useState<Replay>();
    const [tasker, _] = useState(loadReplay(fileName, {
        displayHP: true,
        displayVisionCirc: true,
        displayDebugStr: true,
    }));
    return (
        <main>
        { replay
            ? <ReplayScene replay={replay}></ReplayScene>
            : <LoadingScene tasker={tasker} allComplete={setReplay}></LoadingScene>
        }
        </main>
    );
}