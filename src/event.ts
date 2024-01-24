import { GameElement } from './element';
import { Game } from './game';
import { KeyMap } from './input';
import { PlayerElement, PlayerState, assignColor } from './player';
import { assertDef } from './utils/other';
import { sendAllCommands } from './utils/socket';

export type EventBody = (game: Game, param: EventEntry) => void;

/**
 * Game event class. Each event is defined with its event type, timestamp when the event occurs,
 * and the event parameter.
 */
export class GameEvent {
    t: number;           // timestamp of this event (number of miliseconds since the game starts)
    callback: EventBody;
    params: EventEntry;
    constructor(timestamp: number, callback: EventBody, params: EventEntry) {
        this.t = timestamp;
        this.callback = callback;
        this.params = params;
    }
}

/**
 * This is for sorting events by their timestamp in priority queue, now deprecated.
 */
GameEvent.prototype.valueOf = function() {
    return this.t;
}

/**
 * Mapping from all graphics-related event's serial name to event's callback function.
 * If an event is not in the list below (such as HP update event), it will be ignored.
 */
export const GAME_EVENTS: { [key: string]: EventBody } = {
    "MapCrt": (game, param) => {
        // Map Creation event
        // This is triggered when the map is created. Usually it is triggered only at the beginning of the game.
        game.width = param.x ?? game.width;
        game.height = param.y ?? game.height;
        game.unitPixel = Math.min(game.app.renderer.width / game.width, game.app.renderer.height / game.height);
        game.windowResize(game.app.renderer.width, game.app.renderer.height);
        const newMap = param.map;
        let uid = param.uid ?? 0;  // UID of the first non-empty block
        for(let j = 0; j < game.height; j++) {
            for(let i = 0; i < game.width; i++) {
                if(newMap[j * game.width + i] && newMap[j * game.width + i] != "") {
                    // add a new block corresponding to the map
                    const type = game.elemData.get(newMap[j * game.width + i])!;
                    const elem = new GameElement(type, game, i + 0.5, game.height - j - 0.5, 0, 1, 1);
                    if(game.options.mode.kind == "RealTime") {
                        // For real-time mode, every block should be invisible at first.
                        // Otherwise the player can see the whole map at the beginning.
                        elem.updateVisibility(false);
                    }
                    game.addElement(uid, elem);
                    uid++;
                }
            }
        }
    },
    "EleCrt": (game, param) => {
        // Element Creation event
        // This is triggered when a new element is added to the screen.
        const type = assertDef(game.elemData.get(param.name), `Invalid element type: ${param.name}`);
        if(param.name == "Tk") {
            // special case of Tank
            const elem = new PlayerElement(
                type, game, param.x, param.y,
                assertDef(param.player, `Name of the player with uid ${param.uid} is undefined`),
                param.rad,
                param.maxHp,
                assignColor()
            );
            game.addElement(param.uid, elem);
            game.players.set(param.uid, elem);
            if(param.plr != undefined) {
                param.plr.uid = param.uid;
                GAME_EVENTS.PlrUpd(game, param.plr);    // pass the `plr` parameter to player update event handler
            }
            // Always display the information of all current players on the screen.
            game.setDisplayedPlayers(Array.from(game.players.values()));
            if(game.options.mode.kind == "RealTime") {
                const mode = game.options.mode;
                // if the game is in real-time mode and this player is the current player this GUI is controlling,
                if(elem.name == mode.name) {
                    game.onThisPlayerAdded(elem, param.uid);
                }
            }
        } else {
            // Other elements. Depending on the game mode and vision radius, some elements may be invisible.
            const elem = new GameElement(type, game, param.x, param.y, param.rad, param.width ?? type.width, param.height ?? type.height);
            if(game.options.mode.kind == "RealTime" &&
                (game.options.mode.myPlayer === undefined || elem.getDistanceTo(game.options.mode.myPlayer) > game.options.mode.myPlayer.visionRadius)) {
                elem.updateVisibility(false);
            }
            game.addElement(param.uid, elem);
        }
    },
    "EleRmv": (game, param) => {
        // Element Removal event
        // This is triggered when an element is removed from the screen.
        const elem = game.removeElement(assertDef(param.uid, "Element remove event must have uid."));
        if(elem instanceof PlayerElement) {
            game.getPlayer(param.uid)!.alive = false;  // Set the `alive` of this player to false
            if(game.options.mode.kind === "RealTime") {
                const mode = game.options.mode;
                if(param.uid === mode.myUID) {
                    // If this player dies, output an error message
                    game.errorCallback?.(["You died!"]);
                    // send a vibration to the gamepad, if there is any
                    if(game.gamepadID !== undefined) {
                        navigator.getGamepads()[game.gamepadID]?.vibrationActuator?.playEffect("dual-rumble", {
                            duration: 500,
                            strongMagnitude: 1.0,
                            weakMagnitude: 1.0
                        });
                    }
                    // set all element to visible
                    game.makeAllVisible();
                }
            }
            // display the information of all current players on the screen
            game.setDisplayedPlayers(Array.from(game.players.values()));
        }
    },
    "EleUpd": (game, param) => {
        // Element Update event
        // This is triggered when a property of an element (position, rotation, hp, etc.) is updated.
        const elem = game.getElement(assertDef(param.uid, "Element update event must have uid."));
        if(elem) {
            elem.x = param.x ?? elem.x;
            elem.y = param.y ?? elem.y;
            elem.rad = param.rad ?? elem.rad;
            elem.hp = param.hp ?? elem.hp;
            elem.update();
            if(game.options.mode.kind === "RealTime" && game.options.mode.myPlayer != undefined) {
                const player = game.options.mode.myPlayer;
                // If the current player's status is updated, update the visibility of elements around this player.
                if(elem == player) {
                    game.updateVisibility(elem as PlayerElement, game.options.mode.myPlayer.visionRadius);
                } else if(!(elem instanceof PlayerElement)) {
                    elem.updateVisibility(elem.getDistanceTo(player) <= game.options.mode.myPlayer.visionRadius);
                }
            }
        }
    },
    "PlrUpd": (game, param) => {
        // Player Update event
        // This is triggered when a property uniquely related to a player (money, vision radius, etc.) is updated.
        const elem = game.players.get(assertDef(param.uid, "Player update event must have uid."));
        if(elem) {
            elem.money = param.money ?? elem.money;
            elem.visionRadius = param.visRad ?? elem.visionRadius;
            elem.maxHp = param.mHP ?? elem.maxHp;
            elem.tankSpeed = param.tkSpd ?? elem.tankSpeed;
            elem.debugStr = param.dbgStr ?? elem.debugStr;
            // TODO: support other properties that is able to update
            elem.update();
            if(game.options.mode.kind === "RealTime" && game.options.mode.myUID != undefined && param.uid == game.options.mode.myUID) {
                const mode = game.options.mode;
                // Properties of the player controlled by this program is updated in real-time mode.
                // Therefore, update the visibility of elements around this player.
                game.updateVisibility(elem as PlayerElement, mode.myPlayer!.visionRadius);
            }
        }
    },
    "MktUpd": (game, param) => {
        // Market Update event
        // This is triggered when the market is updated.
        // The specific behavior of this event depends on the pricing rule.
        game.options.pricingRule.processEvent(game, param);
    },
    "End": (game, param) => {
        // Game End event
        // This is triggerd when the game ends.
        game.gameEndCallback(param as EndEvent);
        game.pause();
    }
};


/**
 * Event in replay file's format.
 */
export type EventEntry = { type: string, t: number, [key: string]: any };

/**
 * Format of the initialization event.
 * Since `InitEvent` is special, it is dealt before the game is created.
 */
export type InitEvent = {
    type: "Init",
    t: number,
    pricingRule: string,
    plr: {
        money: number,
        visRad: number,
        mHP: number,
        tkArea: number,
        tkSpd: number,
        // TODO: more
    }
};

/**
 * Format of the ending event.
 */
export type EndEvent = {
    type: "End",
    t: number,
    uids: number[],
    rank?: number[],
};