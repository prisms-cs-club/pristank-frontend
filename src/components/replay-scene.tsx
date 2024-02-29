import { Replay } from "@/replay";
import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import replayStyles from "@/app/replay/replay.module.css";
import { PlayersPanel } from "./players";
import PropIcon from "./icon";
import GameEndPanel from "./game-end";
import { EndEvent } from "@/event";

const PLAY_AT_START = true;

export default function ReplayScene({ replay }: { replay: Replay }) {
    const [playOrPause, setPlayOrPause] = useState<boolean>(PLAY_AT_START);
    const [playbackSpeedLog2, setPlaybackSpeedLog2] = useState<number>(0);
    const [timer, setTimer] = useState<number>(0);
    const [gameEnd, setGameEnd] = useState<EndEvent>();
    useEffect(() => {
        replay.timerCallbacks.push(setTimer);
        replay.gameEndCallback = setGameEnd;
        const canvas = replay.app.view as unknown as HTMLElement;
        canvas.classList.add(styles["game-canvas"]);
        document.getElementsByClassName(styles["game-container"])[0].appendChild(canvas);
        replay.pricingRule.init(replay);
        if(PLAY_AT_START) {
            replay.play();
        }
    }, [replay]);
    return <div id="root">
        <div className={styles["left-panel"]}>
            <PlayersPanel parent={replay}></PlayersPanel>
        </div>
        <div className={styles["game-container"]}></div>
        { gameEnd && <GameEndPanel parent={replay} endEvent={gameEnd}></GameEndPanel> }
        <div className={styles["right-panel"]}>
            <div className={styles["card"]}>
                <h2>Playback Controller</h2>
                <div className={replayStyles["playback-controller"]}>
                    <button onClick={e => {
                        if(playOrPause) { replay.pause(); }
                        else { replay.play(); }
                        setPlayOrPause(!playOrPause);
                    }}>
                        <PropIcon name={playOrPause ? "pause" : "play"}></PropIcon>
                    </button>
                    <button onClick={e => {
                        setPlaybackSpeedLog2(playbackSpeedLog2 - 1);
                        replay.adjustSpeed(2 ** playbackSpeedLog2);
                    }}>
                        <PropIcon name="speed-down"></PropIcon>
                    </button>
                    <button onClick={e => {
                        setPlaybackSpeedLog2(playbackSpeedLog2 + 1);
                        replay.adjustSpeed(2 ** playbackSpeedLog2);
                    }}>
                        <PropIcon name="speed-up"></PropIcon>
                    </button>
                </div>
                <p>Playback speed: {(playbackSpeedLog2 >= 0) ? Math.round(2 ** playbackSpeedLog2) : (`1/${Math.round(2 ** (-playbackSpeedLog2))}`)}x</p>
                <p>Current time: {Math.round(timer) / 1000} seconds</p>
                <progress id="time" value={timer} max={replay.maxTime}>{Math.round(timer) / 1000} s</progress>
            </div>
            <div className={styles["card"]}>
                <h2>Rule: {replay.pricingRule.name}</h2>
            </div>
            <div className={styles["card"]} id="pricing-rule"></div>
        </div>
    </div>
}