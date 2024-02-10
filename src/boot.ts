/**
 * This module loads necessary resources and initialize the game.
 */

import { createElement } from "react";
import { GamepadBinding, KeyBinding, KeyMap } from "./input";
import TextBox from "@/components/text-box";
import { ElementData } from "./element";
import { InitEvent } from "./event";
import { Game, ObserverMode, PlayerMode } from "./game";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";
import ReactDOM from "react-dom/client";
import { PRICING_RULES } from "./market";
import { strictField } from "./utils/other";
import config from "@/config.json";
import { GameOptions } from "./game-ui";

/**
 * Options for loading the game.
 * 
 * You can specify the path of each resource file, timeout of socket connection, etc. in
 * this object.
 */
export type LoadOptions = {
    boot?: {
        elementData?: string,
        textures?: string,
    },
    socketTimeout: number;  // Timeout of the web socket (in miliseconds).
                            // If the connection to server is not established within the timeout, it will throw an error.
    host: string;
    port?: number;
    keyBinding: KeyBinding[];
    gamepadBinding: GamepadBinding[];

    // display options
    displayOptions: Omit<GameOptions, "defaultPlayerProp">;
};

/**
 * Load all resources required to launch the game.
 * During loading, the first `Init` event will be consumed and the event after that will be passed to the game.
 * @param options Loading options. This includes all adjustable options when loading the game.
 * @param taskStart Callback function when a task starts executing.
 * @param taskComplete Callback function when a task completes executing.
 * @returns The tasker that yields a GameDisplay object.
 */
export function loadGame(options: LoadOptions): Tasker {
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
            const data = await fetch(options.boot?.elementData ?? config.path.elementData).then(data => data.json());
            for(const [_, entry] of Object.entries(data as { [key: string]: ElementData })) {
                // fill the default values
                for(const part of entry.parts) {
                    part.xOffset ??= 0;
                    part.yOffset ??= 0;
                    part.width ??= 1;
                    part.height ??= 1;
                    part.bgColor ??= false;
                }
            }
            return new Map(Object.entries(data));
        }
    };

    const loadTextures: Task<Map<string, PIXI.Texture>> = {
        // load all textures using the entries in "/resource/textures.json"
        prerequisite: [],
        callback: async () => {
            const textures = new Map<string, PIXI.Texture>();
            const textureNames = await (fetch(options.boot?.textures ?? config.path.texture)).then(data => data.json());
            for(const [name, file] of Object.entries(textureNames)) {
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
                if(options.port != undefined) {
                    // if the port number is already given, directly return it
                    resolve(options.port);
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
    const initGameDisplay: Task<Game> = {
        // initialize the game display with the loaded data
        prerequisite: [
            "load element data",
            "load textures",
            "acquire name",
            "acquire port number"
        ],
        callback: (
            elemData: Map<string, ElementData>,
            textures: Map<string, PIXI.Texture>,
            name: string,
            port: number,
        ) => {
            return new Promise((resolve, reject) => {
                const addr = `ws://${options.host}:${port}`;
                const socket = new WebSocket(addr);
                const app = new PIXI.Application({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: 0x000000,
                    antialias: true,
                });
                socket.onmessage = msg => {
                    const initEvent = JSON.parse(msg.data) as InitEvent;
                    const pricingRule = strictField(PRICING_RULES, initEvent.pricingRule, `Invalid pricing rule: ${initEvent.pricingRule}`);
                    // add the pricing rule's key binding and gamepad binding to the list of all key & gamepad bindings
                    if(pricingRule.keyBinding !== undefined) {
                        options.keyBinding.push(pricingRule.keyBinding);
                    }
                    if(pricingRule.gamepadBinding !== undefined) {
                        options.gamepadBinding.push(pricingRule.gamepadBinding);
                    }
                    // if the name is left blank, automatically enter observer mode
                    // otherwise, enter real-time playing mode
                    const mode: PlayerMode | ObserverMode = (name != "") ?
                        { kind: "RealTime", socket, keyBinding: options.keyBinding, gamepadBindings: options.gamepadBinding, name } :
                        { kind: "Observer", socket };
                    const game = new Game(app, textures, elemData, pricingRule, mode, {
                        displayHP: options.displayOptions.displayHP,
                        displayVisionCirc: options.displayOptions.displayVisionCirc,
                        displayDebugStr: options.displayOptions.displayDebugStr,
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
        "acquire name": acquireName,
        "acquire port number": acquirePortNum,
        "initialize game": initGameDisplay
    }, "initialize game");
}