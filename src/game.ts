import { UID } from "./utils/type";
import { ElementData, GameElement } from "./element";
import { EndEvent, EventEntry, GAME_EVENTS, GameEvent, InitEvent } from "./event";
import * as PIXI from "pixi.js";
import { PlayerElement, PlayerState } from "./player";
import { Queue } from "@datastructures-js/queue";
import { PricingRule } from "./market";
import { GamepadBinding, KeyBinding, KeyMap } from "./input";
import { sendAllCommands } from "./utils/socket";
import { Tile } from "./tile";
import { GameOptions, GameUI } from "./game-ui";

export interface PlayerMode {
    readonly kind: "RealTime";
    socket: WebSocket;
    keyBinding: KeyBinding[];
    keymap?: KeyMap;
    gamepadBindings: GamepadBinding[];
    name: string;
    myUID?: number;                 // UID of the tank controlled by the player
    myPlayer?: PlayerElement;       // The tank controlled by the player
}

export interface ObserverMode {
    readonly kind: "Observer";
    socket: WebSocket;
}

export type GameMode = PlayerMode | ObserverMode;

/**
 * The game. This class is responsible for rendering the game screen, processing events, and
 * maintaining the game state.
 */
export class Game extends GameUI {
    mode: GameMode;
    gamepadID?: number;                    // ID of the first gamepad connected, if any.
    eventQueue: Queue<GameEvent>;         // Event queue. The event with the lowest timestamp will be processed first.

    errorCallback?: (messages: string[]) => void; // If this function is called, the game will terminate immediately.

    constructor(
        app: PIXI.Application,
        textures: Map<string, PIXI.Texture>,
        elemData: Map<string, ElementData>,
        pricingRule: PricingRule,
        mode: GameMode,
        options: GameOptions,
        errorCallback?: (messages: string[]) => void,
        width?: number,
        height?: number,
    ) {
        super(app, options, textures, elemData, pricingRule, width, height);
        this.mode = mode;
        this.eventQueue = new Queue();
        this.errorCallback = errorCallback;
    
        // initialize ticker
        this.app.ticker.autoStart = false;
        this.app.ticker.add(_ => Game.gameLoop(this));

        if(mode.kind == "RealTime" || mode.kind == "Observer") {
            const socket = mode.socket!;
            // intiialize socket
            socket.onmessage = msgEvent => {
                const data = JSON.parse(msgEvent.data) as EventEntry;
                if(GAME_EVENTS[data.type] !== undefined) {
                    const event = new GameEvent(data.t, GAME_EVENTS[data.type], data);
                    this.eventQueue.enqueue(event);   // TODO: enqueue or evaluate now?
                }
            };
            socket.onerror = errEvent => {
                this.errorCallback?.(["An error occured with WebSocket.", `Error type: ${errEvent.type}`]);
            }
            socket.onclose = event => {
                this.errorCallback?.(["WebSocket was closed before game ends."]);
            }
            if(mode.kind == "RealTime") {
                // add listeners to gamepads
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

    /**
     * When the player controlled by this GUI is added to the game, this function is called.
     * 
     * This function will initialize relevant properties of the game, such as the player list,
     * keymap, etc.
     * @param player The added player.
     * @param uid The UID of this player.
     */
    onThisPlayerAdded(player: PlayerElement, uid: number) {
        const mode = this.mode as PlayerMode;
        // assign the player's UID and the player object to the game
        mode.myUID = uid;
        mode.myPlayer = player;
        // then, set the visibility of all elements
        this.updateVisibility(player, player.visionRadius);
        // create the key map and add all bindings to the map
        mode.keymap = new KeyMap();
        for(const binding of mode.keyBinding) {
            binding(mode.keymap!, mode.myPlayer!);
        }
        // add event listeners to keys
        window.addEventListener("keydown", e => sendAllCommands(mode.keymap!.onKeyDown(e.code), mode.socket, this.timer));
        window.addEventListener("keyup", e => sendAllCommands(mode.keymap!.onKeyUp(e.code), mode.socket, this.timer));
    }

    static gameLoop(game: Game) {
        try {
            game.updateAt(game.timer);
            if(game.mode.kind == "RealTime" && game.gamepadID != undefined) {
                const gamepad = navigator.getGamepads()[game.gamepadID]!;
                const mode = game.mode;
                if(mode.myPlayer !== undefined && gamepad !== undefined) {
                    // if any game pad is connected, use it to control the tank
                    const commands = mode.gamepadBindings.map(binding => binding(gamepad, mode.myPlayer!)).flat();
                    sendAllCommands(commands, mode.socket, game.timer);
                }
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
                    this.errorCallback(["An error occured. Play aborted.", "Press F12 and check \"console\" page for more detail."]);
                }
                return false;
            }
        }
        return true;
    }
}