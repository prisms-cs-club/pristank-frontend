import { UID } from "./utils/type";
import { ElementData, GameElement } from "./element";
import { EndEvent, EventEntry, GAME_EVENTS, GameEvent, InitEvent } from "./event";
import * as PIXI from "pixi.js";
import { PlayerElement, PlayerState } from "./player";
import { GamepadBinding, KeyBinding, actions, gamepadLoop, keyDownEvent, keyUpEvent } from "./input";
import { Queue } from "@datastructures-js/queue";
import { PricingRule } from "./market";

export interface ReplayMode {
    readonly kind: "Replay";
    events: GameEvent[];
}

export interface PlayerMode {
    readonly kind: "RealTime";
    socket: WebSocket;
    keyBinding: KeyBinding;
    gamepadBinding: GamepadBinding;
    name: string;
    myUID?: number;                 // UID of the tank controlled by the player
    myPlayer?: PlayerElement;       // The tank controlled by the player
}

export interface ObserverMode {
    readonly kind: "Observer";
    socket: WebSocket;
}

export type GameMode = ReplayMode | PlayerMode | ObserverMode;

export type GameOptions = {
    mode: GameMode;
    displayHP: boolean;
    displayVisionCirc: boolean;
    displayDebugStr: boolean;
    pricingRule: PricingRule;
    defaultPlayerProp: InitEvent["plr"];
}

/**
 * The game. This class is responsible for rendering the game screen, processing events, and
 * maintaining the game state.
 */
export class GameDisplay {
    options: GameOptions;                  // TODO: a better design
    app: PIXI.Application;
    gamepadID?: number;                    // ID of the first gamepad connected, if any.
    timer: number = 0;                     // Timer. This is set to 0 when the game starts.
    textures: Map<string, PIXI.Texture>;   // Collection of textures
    width: number;      // width in game unit (number of blocks)
    height: number;     // height in game unit (number of blocks)
    unitPixel: number;  // number of pixels per game unit
    elemData: Map<string, ElementData>;   // graphics data of each element, including its width, height, hp, etc.
    elemList: Map<UID, GameElement>;      // Mapping from all element's UID to the element object.
    eventQueue: Queue<GameEvent>;         // Event queue. The event with the lowest timestamp will be processed first.
    players: Map<UID, PlayerElement>;     // Mapping from each player's UID to its element.
    setPlayers!: (players: PlayerElement[]) => void;
    gameEndCallback!: (event: EndEvent) => void;
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
        this.app.ticker.add(_ => GameDisplay.gameLoop(this));

        if(options.mode.kind == "RealTime" || options.mode.kind == "Observer") {
            const socket = options.mode.socket!;
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
                const mode = options.mode;
                const binding = options.mode.keyBinding!;
                // add event listeners to keys and gamepads
                window.addEventListener("keydown", keyDownEvent(this, mode, binding));
                window.addEventListener("keyup", keyUpEvent(this, mode, binding));
                window.addEventListener("gamepadconnected", event => {
                    console.log(`gamepad ${event.gamepad.id} connected`);
                    this.gamepadID = event.gamepad.index;
                });
                window.addEventListener("gamepaddisconnected", event => {
                    console.log(`gamepad ${event.gamepad.id} disconnected`);
                    if(event.gamepad.index == this.gamepadID) {
                        this.gamepadID = undefined;
                    }
                });
            }
        }
    }

    static gameLoop(game: GameDisplay) {
        try {
            game.updateAt(game.timer);
            if(game.options.mode.kind == "RealTime" && game.gamepadID != undefined) {
                // if any game pad is connected, use it to control the tank
                gamepadLoop(game, game.options.mode, navigator.getGamepads()[game.gamepadID]!);
            }
            game.timer += game.app.ticker.elapsedMS;
        } catch(e) {
            console.error(e);
            game.errorCallback?.(["An error occured.", "Press F12 and check \"console\" page for more detail."]);
        }
    }

    start() {
        console.log("game start");
        this.app.ticker.start();
    }

    pause() {
        console.log("game stop");
        this.app.ticker.stop();
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
        this.app.stage.addChild(element.outerContainer);
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
            this.app.stage.removeChild(element.outerContainer);
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
     * Get a reference to the player whose tank has the given UID.
     * @param uid Unique identifier of the tank controlled by the player
     * @returns Player
     */
    getPlayer(uid: UID) {
        return this.players.get(uid);
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
     * Make every element visible on the screen.
     */
    makeAllVisible() {
        for(const elem of this.elemList.values()) {
            elem.updateVisibility(true);
        }
    }

    /**
     * Update the visibility of all elements according to the given player's vision radius.
     * @param player The player in the center of vision circle.
     * @param radius Radius of the vision.
     */
    updateVisibility(player: PlayerElement, radius: number) {
        this.elemList.forEach((elem, uid) => {
            if(!(elem instanceof PlayerElement)) {
                elem.updateVisibility(elem.getDistanceTo(player) <= radius);
            }
        });
    }
}