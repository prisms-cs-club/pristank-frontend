import { GameDisplay } from './game-display';

export type EventParams = { [key: string]: any };
export type EventBody = (map: GameDisplay, param: EventParams) => void;

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
    "MapCrt": (map, param) => {
        map.width = param.x ?? map.width;
        map.height = param.y ?? map.height;
        map.unitPixel = Math.min(map.app.renderer.width / map.width, map.app.renderer.height / map.height);
        map.windowResize(map.app.renderer.width, map.app.renderer.height);
        const newMap = param.map;
        let uid = param.uid ?? 0;  // UID of the first non-empty block
        for(let j = 0; j < map.height; j++) {
            for(let i = 0; i < map.width; i++) {
                if(newMap[j * map.width + i]) {
                    map.addElement(uid, newMap[j * map.width + i], i + 0.5, j + 0.5, 1, 1);
                    uid++;
                }
            }
        }
    },
    "EleCrt": (map, param) => {
        map.addElement(param.uid, param.name, param.x, param.y, param.width, param.height);
    },
    "EleRmv": (map, param) => {
        map.removeElement(param.uid);
    },
    "EleUpd": (map, param) => {
        const elem = map.getElement(param.uid);
        if(elem) {
            elem.x = param.x ?? elem.x;
            elem.y = param.y ?? elem.y;
            elem.rad = param.rad ?? elem.rad;
            elem.hp = param.hp ?? elem.hp;
        }
        map.render();
    }
};