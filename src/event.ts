import { GameDisplay } from './game-display';
import { Player, assignColor } from './player';

export type EventParams = { [key: string]: any };
export type EventBody = (game: GameDisplay, param: EventParams) => void;

/**
 * Game event class. Each event is defined with its event type, timestamp when the event occurs,
 * and the event parameter.
 */
export class GameEvent {
    t: number;           // timestamp of this event (number of miliseconds since the game starts)
    callback: EventBody;
    params: EventParams;
    constructor(timestamp: number, callback: EventBody, params: EventParams) {
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
                    game.addElement(uid, newMap[j * game.width + i], i + 0.5, game.height - j - 0.5, 0, 1, 1);
                    uid++;
                }
            }
        }
    },
    "EleCrt": (game, param) => {
        // special case of Tank
        if(param.name == "Tk") {
            if(!param.player) {
                throw new Error("Invalid event parameter: `player` field is undefined in event.");
            }
            const bgColor = assignColor();
            const elem = game.addElement(param.uid, param.name, param.x, param.y, param.rad, param.width, param.height, bgColor);
            // add the player to the game
            // DON'T replace it with `map.players.push(...)` because `player` array need to be mutated here.
            game.players = [...game.players, new Player(elem, param.player!!, 5, 150, bgColor)];
            if(game.setPlayers != undefined) {
                game.setPlayers(game.players);
            }
        } else {
            game.addElement(param.uid, param.name, param.x, param.y, param.rad, param.width, param.height);
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
            elem.hp = param.hp ?? elem.hp;
        }
        game.render();
    }
};