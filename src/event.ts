import { GameElement } from './element';
import { GameDisplay } from './game-display';
import { PlayerElement, assignColor } from './player';

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
                    game.addElement(uid, elem);
                    uid++;
                }
            }
        }
    },
    "EleCrt": (game, param) => {
        const type = game.elemData.get(param.name)!!;
        if(param.name == "Tk") {
            // special case of Tank
            const elem = new PlayerElement(type, game, param.x, param.y, param.player, 5, param.rad, param.money ?? 150, assignColor()); // TODO: vision range and money
            game.addElement(param.uid, elem);
            game.players.set(elem.name, elem);
            game.setPlayers?.(Array.from(game.players.values()));
        } else {
            const elem = new GameElement(type, game, param.x, param.y, param.rad, param.width ?? type.width, param.height ?? type.height);
            game.addElement(param.uid, elem);
        }
    },
    "EleRmv": (game, param) => {
        game.removeElement(param.uid);
    },
    "EleUpd": (game, param) => {
        const elem = game.getElement(param.uid);
        if(elem) {
            elem.x = param.x ?? elem.x;
            elem.y = param.y ?? elem.y;
            elem.rad = param.rad ?? elem.rad;
            elem.setHp(param.hp ?? elem.hp);
            elem.update();
        }
    },
    "MktUpd": (game, param) => {
        game.options.pricingRule.processEvent(param);
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