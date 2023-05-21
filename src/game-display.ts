import { UID } from "./utils/type";
import { ElementData, GameElement } from "./element";
import { GameEvent } from "./event";
import { MinPriorityQueue, PriorityQueue } from "@datastructures-js/priority-queue";
import * as PIXI from "pixi.js";

export type GameOptions = {
    replay?: GameEvent[];   // When this flag is set, the game will start in replay mode and load
                            // all events in the array.
}
// TODO: Add launch options (e.g. display all/display visible only, real time/replay, etc.)

export class GameDisplay {
    options: GameOptions;
    app: PIXI.Application;
    textures: Map<string, PIXI.Texture>;   // Collection of textures
    width: number;      // width in game unit (number of blocks)
    height: number;     // height in game unit (number of blocks)
    unitPixel: number;  // number of pixels per game unit
    elemData: Map<string, ElementData>;   // graphics data of each element, including its width, height, hp, etc.
    elemList: Map<UID, GameElement>;      // Mapping from all element's UID to the element object.
    eventQueue: PriorityQueue<GameEvent>; // Event queue. The event with the lowest timestamp will be processed first.

    constructor(
        app: PIXI.Application,
        textures: Map<string, PIXI.Texture>,
        elemData: Map<string, ElementData>,
        options: GameOptions,
        width?: number,
        height?: number
    ) {
        this.app = app;
        this.textures = textures;
        this.options = options;
        this.width = width ?? 0;
        this.height = height ?? 0;
        this.unitPixel = Math.min(this.app.renderer.width / this.width, this.app.renderer.height / this.height);
        this.elemData = elemData;
        this.elemList = new Map();
        this.eventQueue = new MinPriorityQueue();

        if(options.replay) {
            // The game is launched in replay mode
            for(const event of options.replay) {
                this.eventQueue.enqueue(event);
            }
        } else {
            // TODO: The game is launched in real time mode
        }
    }

    start() {
        console.log("game start");
        if(this.options.replay) {
            let timer = 0;
            this.app.ticker.add(delta => {
                this.updateAt(timer);
                this.render();
                timer += delta;
            });
        } else {
            // TODO: real time mode
        }
    }

    /**
     * This function is called when the window is resized. The function will resize game display,
     * recalculate the unitPixel, and update all elements' position.
     * @param windowWidth new window width (in number of pixels)
     * @param windowHeight new window height (in number of pixels)
     */
    windowResize(windowWidth: number, windowHeight: number) {
        this.app.renderer.resize(windowWidth, windowHeight);
        this.unitPixel = Math.min(this.app.screen.width / this.width, this.app.screen.height / this.height);
        this.render();
    }

    render() {
        for(const element of this.elemList.values()) {
            element.update();
        }
    }

    /**
     * Update the game state to the given time. This will process all events in the event queue with
     * timestamp less than or equal to the given time.
     * @param atTime The time to update to. If not given, update to the latest time.
     * @returns Whether the update is successful. If some event is damaged and the game is in replay
     *          mode, this function will return false.
     */
    private updateAt(atTime?: number) {
        while(!this.eventQueue.isEmpty() && (!atTime || this.eventQueue.front().timestamp <= atTime)) {
            const event = this.eventQueue.pop();
            try {
                event.callback(this, event.params);
            } catch(e) {
                console.error(e);
                console.error(`Event format damaged at ${event.timestamp}!`);
                if(this.options.replay) {
                    console.error("Replay aborted.");
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Add a new element to the board.
     * @param uid Unique identifier of the newly added element.
     * @param type Type of the element.
     * @param x x coordinate of the element.
     * @param y y coordinate of the element.
     */
    addElement(uid: UID, name: string, x: number, y: number, width?: number, height?: number) {
        const data = this.elemData.get(name)!!;
        const element = new GameElement(
            data, this, x, y, 0,
            width ?? data.width, height ?? data.height
        );
        this.elemList.set(uid, element);
        this.app.stage.addChild(element.container);
    }

    /**
     * Remove an element with given UID from the board.
     * @param uid Unique identifier of the element to be removed.
     */
    removeElement(uid: UID) {
        const element = this.elemList.get(uid);
        if(element) {
            this.app.stage.removeChild(element.container);
            this.elemList.delete(uid);
        }
    }

    /**
     * Get a reference to the element with given UID.
     * @param uid Unique identifier of the element.
     * @returns Element with given UID.
     */
    getElement(uid: UID) {
        return this.elemList.get(uid);
    }
}