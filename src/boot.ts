import { KeyBinding } from "./action";
import { ElementData, ElementModelPart } from "./element";
import { GAME_EVENTS, GameEvent } from "./event";
import { GameDisplay } from "./game-display";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";

export class LoadOptions {
    ELEMENT_DATA_LOCATION: string = "/resource/element-data.json";
    TEXTURES_LOCATION: string = "/resource/textures.json";
    KEY_BINDING_LOCATION: string = "/resource/key-binding.json";
    width: number = window.innerWidth;    // game display's width (in pixels)
    height: number = window.innerHeight;  // game display's heigth (in pixels)
    replay?: string;     // When this flag is set, the game will load the replay file and start in replay mode.
    socketAddr?: string; // When this flag is set, the game will open a WebSocket at this URL.
};

/**
 * Load all resources required to launch the game.
 * @param options Loading options. This includes all adjustable options when loading the game.
 * @returns The loaded game object.
 */
export async function load(options: LoadOptions) {
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

    const replayFile = options.replay;
    if(replayFile) {
        type EventEntry = { t: number, [key: string]: any };   // Event in replay file's format
        const loadReplay: Task<GameEvent[]> = {
            // load replay file
            prerequisite: [],
            callback: async () => {
                const data = (await fetch(replayFile)).json();
                const events: GameEvent[] = (await data as EventEntry[]
                ).map(
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
                    width: options.width,
                    height: options.height,
                    backgroundColor: 0x000000
                });
                const game = new GameDisplay(app, textures, elemData, { loadedEvents: replay });
                return game;
            }
        }
    
        return await Tasker<GameDisplay>({
            "load element data": loadElemData,
            "load textures": loadTextures,
            "load replay file": loadReplay,
            "initialize game": initGameDisplay
        }, "initialize game");

    } else if(options.socketAddr) {
        const loadKeyBinding: Task<KeyBinding> = {
            prerequisite: [],
            callback: async () => {
                const data = (await fetch(options.KEY_BINDING_LOCATION)).json();
                return new Map(Object.entries(await data)) as KeyBinding;
            }
        };

        const addr = options.socketAddr;
        const initGameDisplay: Task<GameDisplay> = {
            // initialize the game display with the loaded data
            prerequisite: ["load element data", "load textures", "load key bindings"],
            callback: (
                elemData: Map<string, ElementData>,
                textures: Map<string, PIXI.Texture>,
                keyBinding: KeyBinding
            ) => {
                const socket = new WebSocket(addr);
                const app = new PIXI.Application({
                    width: options.width,
                    height: options.height,
                    backgroundColor: 0x000000
                });
                const game = new GameDisplay(app, textures, elemData, { loadedEvents: [], socket, keyBinding });
                return new Promise((resolve, reject) => {
                    socket.onopen = _ => {
                        resolve(game);
                    }
                    setTimeout(() => {
                        reject(`Connection to ${addr} timed out.`);
                    }, 20000);
                });
            }
        }
    
        return await Tasker<GameDisplay>({
            "load element data": loadElemData,
            "load textures": loadTextures,
            "load key bindings": loadKeyBinding,
            "initialize game": initGameDisplay
        }, "initialize game");
    }
}