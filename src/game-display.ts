import { UID } from "./utils/type";
import { ElementData, GameElement } from "./element";
import { EventEntry, GAME_EVENTS, GameEvent } from "./event";
import * as PIXI from "pixi.js";
import { PlayerElement } from "./player";
import { KeyBinding, actions } from "./action";
import { Queue } from "@datastructures-js/queue";
import { PricingRule } from "./market";

export interface Replay {
    readonly kind: "Replay";
    events: GameEvent[];
}

export interface RealTime {
    readonly kind: "RealTime";
    socket: WebSocket;
    keyBinding: KeyBinding;
    name: string;
    myUID?: number;                 // UID of the tank controlled by the player
    myPlayer?: PlayerElement;       // The tank controlled by the player
}

export interface Observer {
    readonly kind: "Observer";
    socket: WebSocket;
}

export type GameMode = Replay | RealTime | Observer;

export type GameOptions = {
    mode: GameMode;
    displayHP: boolean;
    pricingRule: PricingRule;
}

/**
 * The game. This class is responsible for rendering the game screen, processing events, and
 * maintaining the game state.
 */
export class GameDisplay {
    options: GameOptions;                  // TODO: a better design
    app: PIXI.Application;
    textures: Map<string, PIXI.Texture>;   // Collection of textures
    width: number;      // width in game unit (number of blocks)
    height: number;     // height in game unit (number of blocks)
    unitPixel: number;  // number of pixels per game unit
    elemData: Map<string, ElementData>;   // graphics data of each element, including its width, height, hp, etc.
    elemList: Map<UID, GameElement>;      // Mapping from all element's UID to the element object.
    eventQueue: Queue<GameEvent>; // Event queue. The event with the lowest timestamp will be processed first.
    players: Map<UID, PlayerElement>;     // Mapping from each player's UID to its element.
    setPlayers!: (players: PlayerElement[]) => void;
    errorCallback?: (messages: string[]) => void; // If this function is called, the game will terminate immediately.

    constructor(
        app: PIXI.Application,
        textures: Map<string, PIXI.Texture>,
        elemData: Map<string, ElementData>,
        options: GameOptions,
        errorCallback?: (messages: string[]) => void,
        width?: number,
        height?: number,
    ) {
        this.options = options;
        this.app = app;
        this.textures = textures;
        this.width = width ?? 0;
        this.height = height ?? 0;
        this.unitPixel = Math.min(this.app.renderer.width / this.width, this.app.renderer.height / this.height);
        this.elemData = elemData;
        this.elemList = new Map();
        this.eventQueue = (options.mode.kind == "Replay") ? new Queue(options.mode.events) : new Queue();
        this.players = new Map();
        this.errorCallback = errorCallback;
    
        // initialize ticker
        this.app.ticker.autoStart = false;
        let timer = 0;
        this.app.ticker.add(_ => {
            try {
                this.updateAt(timer);
                timer += this.app.ticker.elapsedMS;
            } catch(e) {
                errorCallback?.(["An error occured.", "Press F12 and check \"console\" page for more detail."]);
            }
        });

        if(options.mode.kind == "RealTime" || options.mode.kind == "Observer") {
            const socket = options.mode.socket!!;
            // intiialize socket
            socket.onmessage = msgEvent => {
                const data = JSON.parse(msgEvent.data) as EventEntry;
                const event = new GameEvent(data.t, GAME_EVENTS[data.type], data);
                this.eventQueue.enqueue(event);   // TODO: enqueue or evaluate now?
            };
            socket.onerror = errEvent => {
                this.errorCallback?.(["An error occured with WebSocket.", `Error type: ${errEvent.type}`]);
            }
            socket.onclose = event => {
                this.errorCallback?.(["WebSocket was closed before game ends."]);
            }
            if(options.mode.kind == "RealTime") {
                const binding = options.mode.keyBinding!!;
                // add event listeners to keys
                window.addEventListener("keydown", event => {
                    const actionStr = binding.get(event.code);
                    if(actionStr) {
                        //// console.log("key down: " + actionStr);
                        const action = actions.keyDown[actionStr];
                        if(action) {
                            for(const cmd of action()) {
                                socket.send(Math.floor(timer) + " " + cmd);
                            }
                        }
                    }
                });
                window.addEventListener("keyup", event => {
                    const actionStr = binding.get(event.code);
                    if(actionStr) {
                        //// console.log("key up: " + actionStr);
                        const action = actions.keyUp[actionStr];
                        if(action) {
                            for(const cmd of action()) {
                                socket.send(Math.floor(timer) + " " + cmd);
                            }
                        }
                    }
                });
            }
        }
    }

    start() {
        console.log("game start");
        this.app.ticker.start();
    }

    /**
     * This function is called when the window is resized. The function will resize game display,
     * recalculate the unitPixel, and update all elements' position.
     * @param windowWidth new window width (in number of pixels)
     * @param windowHeight new window height (in number of pixels)
     */
    windowResize(windowWidth: number, windowHeight: number) {
        this.unitPixel = Math.min(windowWidth / this.width, windowHeight / this.height);
        this.app.renderer.resize(this.width * this.unitPixel, this.height * this.unitPixel);
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
        while(!this.eventQueue.isEmpty() && (atTime == undefined || this.eventQueue.front().t <= atTime)) {
            const event = this.eventQueue.pop();
            try {
                event.callback(this, event.params);
            } catch(e) {
                console.error(e);
                console.error(`Event format damaged at timestamp ${event.t}!`);
                if(this.errorCallback) {
                    this.errorCallback(["An error occured. Replay aborted.", "Press F12 and check \"console\" page for more detail."]);
                }
                return false;
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
     * @returns The newly added element.
     */
    addElement(uid: UID, element: GameElement): GameElement {
        this.elemList.set(uid, element);
        if(element.visible) {
            this.app.stage.addChild(element.outerContainer);
        }
        return element;
    }

    /**
     * Remove an element with given UID from the board.
     * @param uid Unique identifier of the element to be removed.
     */
    removeElement(uid: UID): GameElement | undefined {
        const element = this.elemList.get(uid);
        if(element) {
            this.elemList.delete(uid);
            if(element.visible) {
                this.app.stage.removeChild(element.outerContainer);
            }
        }
        return element;
    }

    /**
     * Get a reference to the element with given UID.
     * @param uid Unique identifier of the element.
     * @returns Element with given UID.
     */
    getElement(uid: UID) {
        return this.elemList.get(uid);
    }

    /**
     * Get the color of a player given its name.
     * @param uid UID of the player
     * @returns the hexadecimal representation of the player's color
     */
    getPlayerColor(uid: number) {
        return this.players.get(uid)?.color.toHex()
    }

    /**
     * Make an element visible on the screen. This sets the `visible` field to true and adds the
     * element's container to the stage.
     * @param elem The element.
     */
    makeVisible(elem: GameElement) {
        if(!elem.visible) {
            elem.visible = true;
            this.app.stage.addChild(elem.outerContainer); 
        }
    }

    /**
     * Make an element invisible on the screen. This sets the `visible` field to false and removes
     * the element's container from the stage.
     * @param elem The element.
     */
    makeInvisible(elem: GameElement) {
        if(elem.visible) {
            elem.visible = false;
            this.app.stage.removeChild(elem.outerContainer);
        }
    }

    /**
     * Make every element visible on the screen.
     */
    makeAllVisible() {
        for(const elem of this.elemList.values()) {
            this.makeVisible(elem);
        }
    }

    updateVisibility(player: PlayerElement, radius: number) {
        this.elemList.forEach((elem, uid) => {
            if(!(elem instanceof PlayerElement)) {
                if(elem.getDistanceTo(player) <= player.visionRadius) {
                    this.makeVisible(elem);
                } else {
                    this.makeInvisible(elem);
                }
            }
        });
    }
}