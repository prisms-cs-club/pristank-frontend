import { GameElement } from './element';
import { GameDisplay } from './game-display';
import { PlayerElement, assignColor } from './player';
import { assertDef } from './utils/other';

export type EventBody = (game: GameDisplay, param: EventEntry) => void;

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

GameEvent.prototype.valueOf = function() {
    return this.t;
}

/**
 * Mapping from all graphics-related event's serial name to event's callback function.
 * If an event is not in the list below (such as HP update event), it will be ignored.
 */
export const GAME_EVENTS: { [key: string]: EventBody } = {
    "MapCrt": (game, param) => {
        game.width = param.x ?? game.width;
        game.height = param.y ?? game.height;
        game.unitPixel = Math.min(game.app.renderer.width / game.width, game.app.renderer.height / game.height);
        game.windowResize(game.app.renderer.width, game.app.renderer.height);
        const newMap = param.map;
        let uid = param.uid ?? 0;  // UID of the first non-empty block
        for(let j = 0; j < game.height; j++) {
            for(let i = 0; i < game.width; i++) {
                if(newMap[j * game.width + i] && newMap[j * game.width + i] != "") {
                    const type = game.elemData.get(newMap[j * game.width + i])!!;
                    const elem = new GameElement(type, game, i + 0.5, game.height - j - 0.5, 0, 1, 1);
                    if(game.options.mode.kind == "RealTime") {
                        // For real-time mode, every block should be invisible at first.
                        // Otherwise the player can see the whole map at the beginning.
                        elem.visible = false;
                    }
                    game.addElement(uid, elem);
                    uid++;
                }
            }
        }
    },
    "EleCrt": (game, param) => {
        const type = assertDef(game.elemData.get(param.name), `Invalid element type: ${param.name}`);
        if(param.name == "Tk") {
            // special case of Tank
            const elem = new PlayerElement(
                type, game, param.x, param.y,
                assertDef(param.player, `Name of the player with uid ${param.uid} is undefined`),
                assertDef(param.visionRadius, `vision radius of player \"${param.player}\" is undefined`),
                param.rad,
                assertDef(param.money, `Initial money of player \"${param.player}\" is undefined`),
                param.maxHp,
                assignColor()
            );
            game.addElement(param.uid, elem);
            game.players.set(param.uid, elem);
            if(game.options.mode.kind == "RealTime" && elem.name == game.options.mode.name) {
                game.options.mode.myUID = param.uid;
                game.options.mode.myPlayer = elem;
                game.setPlayers([elem]);
            } else {
                game.setPlayers(Array.from(game.players.values()));
            }
        } else {
            // Other elements. Depending on the game mode and vision radius, some elements may be invisible.
            const elem = new GameElement(type, game, param.x, param.y, param.rad, param.width ?? type.width, param.height ?? type.height);
            if(game.options.mode.kind == "RealTime" &&
                (game.options.mode.myPlayer == undefined || elem.getDistanceTo(game.options.mode.myPlayer) > game.options.mode.myPlayer.visionRadius)) {
                elem.visible = false;
            }
            game.addElement(param.uid, elem);
        }
    },
    "EleRmv": (game, param) => {
        const elem = game.removeElement(assertDef(param.uid, "Element remove event must have uid."));
        if(elem instanceof PlayerElement) {
            game.players.delete(param.uid);
            if(game.options.mode.kind == "RealTime") {
                if(param.uid == game.options.mode.myUID) {
                    // If this player dies, output an error message and set all element to visible.
                    game.errorCallback?.(["You died!"]);
                    game.makeAllVisible();
                } else {
                    // If in real-time mode, only the current player's status is visible.
                    game.setPlayers([game.options.mode.myPlayer!!]);
                }
            } else {
                // Otherwise, all players' status are visible.
                game.setPlayers(Array.from(game.players.values()));
            }
        }
    },
    "EleUpd": (game, param) => {
        const elem = game.getElement(assertDef(param.uid, "Element update event must have uid."));
        if(elem) {
            elem.x = param.x ?? elem.x;
            elem.y = param.y ?? elem.y;
            elem.rad = param.rad ?? elem.rad;
            elem.hp = param.hp ?? elem.hp;
            elem.update();
        }
    },
    "PlrUpd": (game, param) => {
        const elem = game.players.get(assertDef(param.uid, "Player update event must have uid."));
        if(elem) {
            elem.money = param.money ?? elem.money;
            elem.visionRadius = param.visRad ?? elem.visionRadius;
            elem.maxHp = param.mHp ?? elem.maxHp;
            // TODO: support other properties that is able to update
            elem.update();
            if(game.options.mode.kind == "RealTime" && game.options.mode.myUID != undefined && param.uid == game.options.mode.myUID) {
                const mode = game.options.mode;
                // Properties of the player controlled by this program is updated in real-time mode.
                // Therefore, update the visibility of elements around this player.
                game.updateVisibility(elem as PlayerElement, mode.myPlayer!!.visionRadius);
            }
        }
    },
    "MktUpd": (game, param) => {
        game.options.pricingRule.processEvent(game, param);
    },
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
    type: "init",
    t: number,
    pricingRule: string,
};