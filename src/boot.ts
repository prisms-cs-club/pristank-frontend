/**
 * This module loads necessary resources and initialize the game.
 */

import { createElement } from "react";
import { KeyBinding } from "./action";
import TextBox from "@/components/text-box";
import { ElementData, ElementModelPart } from "./element";
import { EventEntry, GAME_EVENTS, GameEvent, InitEvent } from "./event";
import { GameDisplay, GameMode, ObserverMode, PlayerMode, ReplayMode } from "./game-display";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";
import ReactDOM from "react-dom/client";
import { PRICING_RULES, PricingRule } from "./market";
import { strictField } from "./utils/other";

export interface LoadReplay {
    readonly kind: "Replay";
    file: string;
};

export interface LoadRealTime {
    readonly kind: "RealTime";
    host: string;
    port?: number;
};

export type LoaderMode = LoadReplay | LoadRealTime;

export const DEFAULT_ELEMENT_DATA_LOCATION = "/resource/element-data.json";
export const DEFAULT_TEXTURES_LOCATION = "/resource/textures.json";
export const DEFAULT_KEY_BINDING_LOCATION = "/resource/key-binding.json";

export type LoadOptions = {
    ELEMENT_DATA_LOCATION?: string;
    TEXTURES_LOCATION?: string;
    KEY_BINDING_LOCATION?: string;
    socketTimeout: number;  // Timeout of the web socket (in miliseconds).
                            // If the connection to server is not established within the timeout, it will throw an error.
    mode: LoaderMode;       // game mode
    displayHP: boolean;     // Whether to display HP bar
    displayVisionCirc: boolean; // Whether to display vision range
    displayDebugStr: boolean;   // Whether to display debug string
};

/**
 * Load all resources required to launch the game.
 * During loading, the first `Init` event will be consumed and the event after that will be passed to the game.
 * @param options Loading options. This includes all adjustable options when loading the game.
 * @param taskStart Callback function when a task starts executing.
 * @param taskComplete Callback function when a task completes executing.
 * @returns The tasker that yields a GameDisplay object.
 */
export function load(options: LoadOptions) {
    // `userInteractionNode` is the DOM element for rendering the text box for reading user input.
    let userInteractionNode: ReactDOM.Root | undefined = undefined;

    function getOrCreateUserInteraction(): ReactDOM.Root {
        if(userInteractionNode == undefined) {
            userInteractionNode = ReactDOM.createRoot(document.getElementById("user-interaction")!);
        }
        return userInteractionNode!!;
    }
    
    const loadElemData: Task<Map<string, ElementData>> = {
        // load element data from "/resource/element-data.json"
        prerequisite: [],
        callback: async () => {
            const data = (await fetch(options.ELEMENT_DATA_LOCATION ?? DEFAULT_ELEMENT_DATA_LOCATION)).json();
            for(const [_, entry] of Object.entries(await data as { [key: string]: ElementData })) {
                // fill the default values
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
            const textureNames = (await fetch(options.TEXTURES_LOCATION ?? DEFAULT_TEXTURES_LOCATION)).json();
            for(const [name, file] of Object.entries(await textureNames)) {
                textures.set(name, PIXI.Texture.from(`/resource/texture/${file}`));
            }
            return textures;
        }
    }

    const acquirePortNum: Task<number> = {
        // acquire port number from user
        prerequisite: ["acquire name"],
        callback: (_) => {
            return new Promise((resolve, reject) => {
                if(options.mode.kind == "RealTime" && options.mode.port != undefined) {
                    // if the port number is already given, directly return it
                    resolve(options.mode.port);
                }
                // otherwise, render a text box to ask the user for the port number
                getOrCreateUserInteraction().render(
                    createElement(TextBox,
                        { type: "number", label: "please enter the port number: ", placeholder: "press ENTER to continue",
                            onSubmit: (port: string) => {
                                getOrCreateUserInteraction().render(null);
                                resolve(parseInt(port));
                            }
                        }
                    )
                );
            });
        }
    };

    switch(options.mode.kind) {
        case "Replay": {
            const replayMode = options.mode;
            /*** Replay Mode ***/
            const replayFile = replayMode.file;
            const loadReplay: Task<[GameEvent[], InitEvent]> = {
                // load replay file
                prerequisite: [],
                callback: async () => {
                    const data = await (await fetch(replayMode.file)).json() as EventEntry[];
                    const initEvent = data[0];
                    const events: GameEvent[] = data.splice(1, data.length).map(
                        entry => new GameEvent(entry.t, GAME_EVENTS[entry.type], entry)
                    );
                    return [events, initEvent as InitEvent];
                }
            };

            const initGameDisplay: Task<GameDisplay> = {
                // initialize the game display with the loaded data
                prerequisite: ["load element data", "load textures", "load replay file"],
                callback: async (
                    elemData: Map<string, ElementData>,
                    textures: Map<string, PIXI.Texture>,
                    [replay, initEvent]: [GameEvent[], InitEvent]
                ) => {
                    const app = new PIXI.Application({
                        width: window.innerWidth,
                        height: window.innerHeight,
                        backgroundColor: 0x000000,
                        antialias: true,
                    });
                    const mode: ReplayMode = { kind: "Replay", events: replay };
                    const game = new GameDisplay(app, textures, elemData, {
                        mode,
                        pricingRule: strictField(PRICING_RULES, initEvent.pricingRule, `Invalid pricing rule: ${initEvent.pricingRule}`),
                        displayHP: options.displayHP,
                        displayVisionCirc: options.displayVisionCirc,
                        displayDebugStr: options.displayDebugStr,
                        defaultPlayerProp: initEvent.plr
                    });
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
                // load key binding from file
                prerequisite: [],
                callback: async () => {
                    const data = (await fetch(options.KEY_BINDING_LOCATION ?? DEFAULT_KEY_BINDING_LOCATION)).json();
                    return new Map(Object.entries(await data)) as KeyBinding;
                }
            };
            const acquireName: Task<string> = {
                // acquire name from user
                prerequisite: [],
                callback: () => {
                    return new Promise<string>((resolve, reject) => {
                        getOrCreateUserInteraction().render(
                            createElement(TextBox,
                                {
                                    type: "text",
                                    label: "Your name here:",
                                    placeholder: "press ENTER to continue.",
                                    onSubmit: (text: string) => {
                                        getOrCreateUserInteraction().render(null);
                                        resolve(text);
                                    }
                                }
                            )
                        );
                    });
                }
            }
            const initGameDisplay: Task<GameDisplay> = {
                // initialize the game display with the loaded data
                prerequisite: ["load element data", "load textures", "load key bindings", "acquire name", "acquire port number"],
                callback: (
                    elemData: Map<string, ElementData>,
                    textures: Map<string, PIXI.Texture>,
                    keyBinding: KeyBinding,
                    name: string,
                    port: number,
                ) => {
                    return new Promise((resolve, reject) => {
                        const addr = `ws://${realTimeMode.host}:${port}`;
                        const socket = new WebSocket(addr);
                        const app = new PIXI.Application({
                            width: window.innerWidth,
                            height: window.innerHeight,
                            backgroundColor: 0x000000,
                            antialias: true,
                        });
                        const mode: PlayerMode | ObserverMode = (name != "") ?
                            { kind: "RealTime", socket, keyBinding, name } :
                            { kind: "Observer", socket };
                        socket.onmessage = msg => {
                            const initEvent = JSON.parse(msg.data) as InitEvent;
                            const game = new GameDisplay(app, textures, elemData, {
                                mode,
                                pricingRule: strictField(PRICING_RULES, initEvent.pricingRule, `Invalid pricing rule: ${initEvent.pricingRule}`),
                                displayHP: options.displayHP,
                                displayVisionCirc: options.displayVisionCirc,
                                displayDebugStr: options.displayDebugStr,
                                defaultPlayerProp: initEvent.plr
                            });
                            socket.send(name);
                            resolve(game);
                        };
                        socket.onclose = event => {
                            reject(`Cannot establish connection to ${addr}: ${event.reason}`);
                        }
                        setTimeout(() => {
                            reject(`Connection to ${addr} timed out.`);
                        }, options.socketTimeout);
                    });
                }
            }
            return new Tasker({
                "load element data": loadElemData,
                "load textures": loadTextures,
                "load key bindings": loadKeyBinding,
                "acquire name": acquireName,
                "acquire port number": acquirePortNum,
                "initialize game": initGameDisplay
            }, "initialize game");
        }
    }
}