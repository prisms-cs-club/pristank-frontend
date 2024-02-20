import * as PIXI from "pixi.js";
import { UID } from "./utils/type";
import { ElementData, GameElement } from "./element";
import { PlayerElement } from "./player";
import { Tile } from "./tile";
import { PricingRule } from "./market";
import { EndEvent, InitEvent } from "./event";

export type GameOptions = {
    displayHP: boolean;
    displayVisionCirc: boolean;
    displayDebugStr: boolean;
    defaultPlayerProp: InitEvent["plr"];
}

/**
 * Parent class of both `Game` and `Replay` classes. Handles the game elements, tiles, resources, UI, pricing rules, etc.
 */
export abstract class GameUI {
    app: PIXI.Application;
    options: GameOptions;
    textures: Map<string, PIXI.Texture>;   // Collection of textures
    width: number;      // width in game unit (number of blocks)
    height: number;     // height in game unit (number of blocks)
    unitPixel: number;  // number of pixels per game unit
    tiles: Tile[];      // Collection of tiles. Initialized when receiving the map creation event.
    elemData: Map<string, ElementData>;   // graphics data of each element, including its width, height, hp, etc.
    elemList: Map<UID, GameElement>;      // Mapping from all element's UID to the element object.
    players: Map<UID, PlayerElement>;     // Mapping from each player's UID to its element.
    pricingRule: PricingRule;
    timer: number = 0;  // current time in milliseconds
    timerCallbacks: Array<(timer: number) => void> = [];
                                          // List of functions to be called when the timer is updated.
    setPlayers!: (players: PlayerElement[]) => void;
    gameEndCallback!: (event: EndEvent) => void;

    abstract pause(): void;

    constructor(
        app: PIXI.Application,
        options: GameOptions,
        textures: Map<string, PIXI.Texture>,
        elemData: Map<string, ElementData>,
        pricingRule: PricingRule,
        width?: number,
        height?: number
    ) {
        this.app = app;
        this.options = options;
        this.textures = textures;
        this.elemData = elemData;
        this.elemList = new Map();
        this.players = new Map();
        this.width = width ?? 0;
        this.height = height ?? 0;
        this.unitPixel = Math.min(this.app.renderer.width / this.width, this.app.renderer.height / this.height);
        this.tiles = [];
        this.pricingRule = pricingRule;
    }

    /**
     * Update all elements in the game. This method is called every frame.
     */
    render() {
        for(const element of this.elemList.values()) {
            element.update();
        }
    }

    /**
     * This function is called when the window is resized. The function will resize game display,
     * recalculate the unitPixel, and update all elements' position.
     * @param windowWidth new window width (in number of pixels). If left blank, use app.renderer.width.
     * @param windowHeight new window height (in number of pixels). If left blank, use app.renderer.height.
     */
    windowRefresh(windowWidth?: number, windowHeight?: number) {
        this.unitPixel = Math.min(
            (windowWidth ?? this.app.renderer.width) / this.width,
            (windowHeight ?? this.app.renderer.height) / this.height
        );
        this.app.renderer.resize(this.width * this.unitPixel, this.height * this.unitPixel);
        this.render();
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

    /**
     * Add a new tile to the game. The tile should always be placed at the bottom layer.
     * @param tile the tile to be added
     */
    addTile(tile: Tile) {
        this.tiles.push(tile);
        this.app.stage.addChildAt(tile.container, 0);
    }
}