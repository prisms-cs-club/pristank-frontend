import { createElement } from "react";
import { KeyBinding } from "./action";
import TextBox from "@/components/text-box";
import { ElementData, ElementModelPart } from "./element";
import { GAME_EVENTS, GameEvent } from "./event";
import { GameDisplay, GameMode, Observer, RealTime, Replay } from "./game-display";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";
import ReactDOM from "react-dom/client";

export interface LoadReplay {
    readonly kind: "Replay";
    file: string;
};

export interface LoadRealTime {
    readonly kind: "RealTime";
    addr: string;
};

export interface LoadObserver {
    readonly kind: "Observer";
    socketAddr: string;
};

export type LoaderMode = LoadReplay | LoadRealTime | LoadObserver;

export class LoadOptions {
    ELEMENT_DATA_LOCATION: string = "/resource/element-data.json";
    TEXTURES_LOCATION: string = "/resource/textures.json";
    KEY_BINDING_LOCATION: string = "/resource/key-binding.json";
    mode: LoaderMode; // game mode
    displayHP: boolean;  // Whether to display HP bar
    constructor(mode: LoaderMode, displayHP?: boolean) {
        this.mode = mode;
        this.displayHP = displayHP ?? true;
    }
};

/**
 * Load all resources required to launch the game.
 * @param options Loading options. This includes all adjustable options when loading the game.
 * @param taskStart Callback function when a task starts executing.
 * @param taskComplete Callback function when a task completes executing.
 * @returns The tasker that yields a GameDisplay object.
 */
export function load(options: LoadOptions) {
    const loadElemData: Task<Map<string, ElementData>> = {
        // load element data from "/resource/element-data.json"
        prerequisite: [],
        callback: async () => {
            const data = (await fetch(options.ELEMENT_DATA_LOCATION)).json();
            for(const [_, entry] of Object.entries(await data as { [key: string]: ElementData })) {
                // fill out the default values
                for(const part of entry.parts) {
                    part.xOffset ??= 0;
                    part.yOffset ??= 0;
                    part.width ??= 1;
                    part.height ??= 1;
                    part.bgColor ??= false;
                }
            }
            return new Map(Object.entries(await data));
        }
    }

    const loadTextures: Task<Map<string, PIXI.Texture>> = {
        // load all textures using the entries in "/resource/textures.json"
        prerequisite: [],
        callback: async () => {
            const textures = new Map<string, PIXI.Texture>();
            const textureNames = (await fetch(options.TEXTURES_LOCATION)).json();
            for(const [name, file] of Object.entries(await textureNames)) {
                textures.set(name, PIXI.Texture.from(`/resource/texture/${file}`));
            }
            return textures;
        }
    }

    switch(options.mode.kind) {
        case "Replay": {
            const replayMode = options.mode;
            /*** Replay Mode ***/
            const replayFile = replayMode.file;
            type EventEntry = { t: number, [key: string]: any };   // Event in replay file's format
            const loadReplay: Task<GameEvent[]> = {
                // load replay file
                prerequisite: [],
                callback: async () => {
                    const data = (await fetch(replayMode.file)).json();
                    const events: GameEvent[] = (await data as EventEntry[]).map(
                        entry => new GameEvent(entry.t, GAME_EVENTS[entry.type], entry)
                    );
                    return events;
                }
            };

            const initGameDisplay: Task<GameDisplay> = {
                // initialize the game display with the loaded data
                prerequisite: ["load element data", "load textures", "load replay file"],
                callback: async (
                    elemData: Map<string, ElementData>,
                    textures: Map<string, PIXI.Texture>,
                    replay: GameEvent[]
                ) => {
                    const app = new PIXI.Application({
                        width: window.innerWidth,
                        height: window.innerHeight,
                        backgroundColor: 0x000000
                    });
                    const mode: Replay = { kind: "Replay", events: replay };
                    const game = new GameDisplay(app, textures, elemData, { mode, displayHP: options.displayHP });
                    return game;
                }
            }

            return new Tasker({
                "load element data": loadElemData,
                "load textures": loadTextures,
                "load replay file": loadReplay,
                "initialize game": initGameDisplay
            }, "initialize game");
        }
    
        case "RealTime": {
            /*** Real-Time Playing Mode ****/
            const realTimeMode = options.mode;
            const loadKeyBinding: Task<KeyBinding> = {
                prerequisite: [],
                callback: async () => {
                    const data = (await fetch(options.KEY_BINDING_LOCATION)).json();
                    return new Map(Object.entries(await data)) as KeyBinding;
                }
            };
            const requireName: Task<string> = {
                prerequisite: [],
                callback: () => {
                    return new Promise<string>((resolve, reject) => {
                        ReactDOM.createRoot(document.getElementById("user-interaction")!).render(
                            createElement(TextBox,
                                { label: "please enter your name: ", placeholder: "press ENTER to continue",
                                    onsubmit: (name: string) => {
                                        document.getElementById("text-box")?.remove()
                                        resolve(name)
                                    }
                                }
                            )
                        );
                    });
                }
            }
            const initGameDisplay: Task<GameDisplay> = {
                // initialize the game display with the loaded data
                prerequisite: ["load element data", "load textures", "load key bindings", "require name"],
                callback: (
                    elemData: Map<string, ElementData>,
                    textures: Map<string, PIXI.Texture>,
                    keyBinding: KeyBinding,
                    name: string
                ) => {
                    return new Promise((resolve, reject) => {
                        const socket = new WebSocket(realTimeMode.addr);
                        const app = new PIXI.Application({
                            width: window.innerWidth,
                            height: window.innerHeight,
                            backgroundColor: 0x000000
                        });
                        const mode: RealTime = { kind: "RealTime", socket, keyBinding, name };
                        const game = new GameDisplay(app, textures, elemData, { mode, displayHP: options.displayHP });
                        socket.onopen = _ => {
                            socket.send(name);
                            resolve(game);
                        }
                        socket.onclose = _ => {
                            reject(`Cannot establish connection to ${realTimeMode.addr}`);
                        }
                        setTimeout(() => {
                            reject(`Connection to ${realTimeMode.addr} timed out.`);
                        }, 10000);
                    });
                }
            }
            return new Tasker({
                "load element data": loadElemData,
                "load textures": loadTextures,
                "load key bindings": loadKeyBinding,
                "require name": requireName,
                "initialize game": initGameDisplay
            }, "initialize game");
        }

        case "Observer": {
            const addr = options.mode.socketAddr;
            const initGameDisplay: Task<GameDisplay> = {
                // initialize the game display with the loaded data
                prerequisite: ["load element data", "load textures"],
                callback: (
                    elemData: Map<string, ElementData>,
                    textures: Map<string, PIXI.Texture>
                ) => {
                    return new Promise((resolve, reject) => {
                        const socket = new WebSocket(addr);
                        const app = new PIXI.Application({
                            width: window.innerWidth,
                            height: window.innerHeight,
                            backgroundColor: 0x000000
                        });
                        const mode: Observer = { kind: "Observer", socket };
                        const game = new GameDisplay(app, textures, elemData, { mode, displayHP: options.displayHP });
                        socket.onopen = _ => {
                            socket.send("OBSERVER");
                            resolve(game);
                        }
                        socket.onclose = _ => {
                            reject(`Cannot establish connection to ${addr}`);
                        }
                        setTimeout(() => {
                            reject(`Connection to ${addr} timed out.`);
                        }, 10000);
                    });
                }
            }
            return new Tasker({
                "load element data": loadElemData,
                "load textures": loadTextures,
                "initialize game": initGameDisplay
            }, "initialize game");
        }
    }
}