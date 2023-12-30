# How to write your own key binding / gamepad binding?

*This documentation is for version 0.3.1 or higher*

There are already some available key & gamepad bindings under the `src/bindings/` folder in the project. You can use these as your reference to write your own bindings.

## Key Bindings

Key binding is defined as an operation to a key map giving the game and the player object. To be specific, its type is defined as:

```typescript
type KeyBinding = (keymap: KeyMap, player: PlayerElement) => void;
```

You can use the `addKeyDownHandler` and `addKeyUpHandler` methods to add event handlers to the `KeyMap` object. The signature of these two methods are:

```typescript
class KeyMap {
    addKeyDownHandler: (keyCode: string, handler: () => string[]) => void;
    addKeyUpHandler: (keyCode: string, handler: () => string[]) => void;
}
```

The `keyCode` here is a string representing the key being pressed or released (for more, see <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code>). The `handler` is an arbitrary function that returns a list of commands. All the available commands are listed in [Communication Protocol](TODO) page.

For example, if you want to bind 'pressing down key `M`' to 'firing a bullet', you can write a key map like this:

```typescript
const keyBinding: KeyBinding = (keymap, player) => {
    keymap.addKeyDownHandler("KeyM", () => {
        return ["fire"];
    });
};
```

## Gamepad Binding

Gamepad binding is similar to key binding, except that you directly return the list of commands instead of adding it to a handler.

```typescript
(gamepad: Gamepad, player: PlayerElement) => string[];
```

The `Gamepad` API is defined here: <https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API>.

For example, if you want to associate the button `A` with firing a bullet, you should write your code like this:

```typescript
const gamepadBinding = (gamepad, player) => {
    if(gamepad.buttons[0].pressed) {
        return ["fire"];
    } else {
        return [];
    }
};
```

## Add Key and Gamepad Bindings to the Game

### Add in Loading Options

Some key bindings and gamepad bindings are passed to the game in its loading options. In the `LoadRealTime` option, you can pass in an array of key bindings and gamepad bindings. For example, this is the default loading option.

```typescript
const mode: LoadRealTime = {
    kind: "RealTime",
    host: "localhost",
    keyBinding: [require("@/bindings/key-movement-binding").keyBinding, require("@/bindings/key-fire-binding").keyBinding],
    gamepadBinding: [require("@/bindings/gamepad-binding-1").gamepadBinding],
};
```

Here, the loading option includes two key bindings -- one is the file `bindings/key-movement-binding.ts`, binding `WASD` to the movement of the tank, and the other is `bindings/key-fire-binding.ts`, binding `Space` to firing bullets. Besides, there is one gamepad binding in file `bindings/gamepad-binding-1.ts`, binding the left and right axes to the movement of tanks and button `X` to firing.

If you want to modify the existing bindings or add your own bindings, you only need to modify the two arrays to load the proper bindings to the game.

### Adding Key / Gamepad Binding in Market Rules

If you are defining a binding related to a specific market rule, then we recommend you to add your key / gamepad binding through the market rule you defined. The `PricingRule` interface contains two optional parameters -- `keyBinding` and `gamepadBinding` -- by which you can define the key and gamepad bindings for the market rule.

For example, in the standard auction rule, the key binding for bidding is defined like this:

```typescript
function auctionKeyBinding(rule: AuctionRule): KeyBinding {
    return (keymap, player) => {
        keymap.addKeyDownHandler("Enter", () => {
            return [`market.bid ${rule.myBid}`];
        });
    };
}
```

This associates `Enter` key with sending a bidding request to the game server. Since key binding itself does not contain the market rule for the game, we recommend you to wrap your key binding in a function with the market rule as a parameter. Then, inside your market rule class, you can load the key binding like this:

```typescript
class AuctionRule {
    // ...
    keyBinding: KeyBinding = auctionKeyBinding(this);
    // ...
}
```
