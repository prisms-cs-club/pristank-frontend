import { Replay } from "@/replay";
import { createContext, useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import replayStyles from "@/app/replay/replay.module.css";
import { PlayersPanel } from "./players";
import PropIcon from "./icon";

export const ReplayContext = createContext<Replay | undefined>(undefined);

export default function ReplayScene({ replay }: { replay: Replay }) {
    const [playbackSpeedLog2, setPlaybackSpeedLog2] = useState<number>(0);
    useEffect(() => {
        const canvas = replay.app.view as unknown as HTMLElement;
        canvas.classList.add(styles["game-canvas"]);
        document.getElementsByClassName(styles["game-container"])[0].appendChild(canvas);
        replay.play();
        replay.pricingRule.init(replay);
    });
    return <div className={styles["game-container"]}>
        <ReplayContext.Provider value={replay}>
            <div className={styles["left-panel"]}>
                <PlayersPanel parent={replay}></PlayersPanel>
            </div>
            <div className={styles["right-panel"]}>
                <div className={styles["card"]}>
                    <h2>Playback Controller</h2>
                    <div className={replayStyles["playback-controller"]}>
                        <button onClick={e => replay.play()}><PropIcon name="play"></PropIcon></button>
                        <button onClick={e => replay.pause()}><PropIcon name="pause"></PropIcon></button>
                        <button onClick={e => {
                            setPlaybackSpeedLog2(playbackSpeedLog2 + 1);
                            replay.adjustSpeed(2 ** playbackSpeedLog2);
                        }}>
                            <PropIcon name="speed-up"></PropIcon>
                        </button>
                        <button onClick={e => {
                            setPlaybackSpeedLog2(playbackSpeedLog2 - 1);
                            replay.adjustSpeed(2 ** playbackSpeedLog2);
                        }}>
                            <PropIcon name="speed-down"></PropIcon>
                        </button>
                    </div>
                    <p>Playback speed: {(playbackSpeedLog2 >= 0) ? Math.round(2 ** playbackSpeedLog2) : (`1/${Math.round(2 ** (-playbackSpeedLog2))}`)}x</p>
                </div>
                <div className={styles["card"]}>
                    <h2>Rule: {replay.pricingRule.name}</h2>
                </div>
                <div className={styles["card"]} id="pricing-rule"></div>
            </div>
        </ReplayContext.Provider>
    </div>
}