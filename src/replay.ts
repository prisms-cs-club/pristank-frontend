import { ElementData } from "./element";
import { EventEntry, GAME_EVENTS, GameEvent, InitEvent } from "./event";
import { PRICING_RULES, PricingRule } from "./market";
import { sortByKey, strictField } from "./utils/other";
import { Task, Tasker } from "./utils/tasker";
import * as PIXI from "pixi.js";
import config from "@/config.json";
import { GameOptions, GameUI } from "./game-ui";

/// Tasks before loading the Replay ///
export function loadReplay(replayFileDir: string, options: Omit<GameOptions, "defaultPlayerProp">): Tasker {
    const loadElemData: Task<Map<string, ElementData>> = {
        prerequisite: [],
        callback: async () => {
            const data = await fetch(config.path.elementData).then(data => data.json()) as { [key: string]: ElementData };
            for(const [_, entry] of Object.entries(data)) {
                // fill out the default values
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
    }

    const loadTextures: Task<Map<string, PIXI.Texture>> = {
        prerequisite: [],
        callback: async () => {
            const textures = new Map<string, PIXI.Texture>();
            const textureNames = await (fetch(config.path.texture)).then(data => data.json());
            for(const [name, file] of Object.entries(textureNames)) {
                textures.set(name, PIXI.Texture.from(`/resource/texture/${file}`));
            }
            return textures;
        }
    }

    const loadReplay: Task<[GameEvent[], InitEvent]> = {
        // load replay file
        prerequisite: [],
        callback: async () => {
            const data = await (await fetch(replayFileDir)).json() as EventEntry[];
            const initEvent = data[0];
            const events: GameEvent[] = data.splice(1, data.length).map(
                entry => new GameEvent(entry.t, GAME_EVENTS[entry.type], entry)
            );
            return [events, initEvent as InitEvent];
        }
    };

    const initReplay: Task<Replay> = {
        // initialize the game display with the loaded data
        prerequisite: ["load element data", "load textures", "load replay file"],
        callback: async (
            elemData: Map<string, ElementData>,
            textures: Map<string, PIXI.Texture>,
            [replay, initEvent]: [GameEvent[], InitEvent],
        ) => {
            const app = new PIXI.Application({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x000000,
                antialias: true,
            });
            const pricingRule = strictField(PRICING_RULES, initEvent.pricingRule);
            const game = new Replay(app, {...options, defaultPlayerProp: initEvent.plr}, textures, elemData, pricingRule, replay);
            return game;
        }
    }

    return new Tasker({
        "load element data": loadElemData,
        "load textures": loadTextures,
        "load replay file": loadReplay,
        "initialize replay": initReplay
    }, "initialize replay");
}

/// The replay class ///

export class Replay extends GameUI {
    private eventList: GameEvent[];
    private nextEventIdx: number = 0;
    playSpeed: number = 1;
    maxTime: number;

    constructor(
        app: PIXI.Application,
        options: GameOptions,
        textures: Map<string, PIXI.Texture>,
        elemData: Map<string, ElementData>,
        pricingRule: PricingRule,
        events: GameEvent[],
        width?: number,
        height?: number
    ) {
        super(app, options, textures, elemData, pricingRule, width, height);
        this.eventList = events;

        sortByKey(this.eventList, e => e.t);
        this.maxTime = this.eventList[this.eventList.length - 1].t;
        
        // set up replay timer
        this.app.ticker.autoStart = false;
        this.app.ticker.add((delta) => {
            this.timerCallbacks.forEach(callback => callback(this.timer));
            while(this.nextEventIdx < this.eventList.length && this.eventList[this.nextEventIdx].t <= this.timer) {
                try {
                    this.eventList[this.nextEventIdx].callback(this, this.eventList[this.nextEventIdx].params);
                } catch(e) {
                    console.error(`Error at event ${this.nextEventIdx}: ${e}`);
                }
                this.nextEventIdx++;
            }
            this.timer += this.app.ticker.elapsedMS * this.playSpeed;
        });
    }

    play() {
        this.app.ticker.start();
    }

    pause() {
        this.app.ticker.stop();
    }

    adjustSpeed(speed: number) {
        this.playSpeed = speed;
    }
}