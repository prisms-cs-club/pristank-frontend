# Graphics Documentation

## Element and Parts

*"Element"* corresponds to a unique object on the game board that moves and acts as a whole. One element may have multiple parts, where a *part* is a region displayed as an image, or *"texture"*.

In `element-data.json`, in the entry of each element type there is a `part` section, storing the default texture of each part in the element, as well as their horizontal (x) and vertical (y) offset from the center of the bounding box:

```json
{
    "<element ID>": {
        // ...
        "parts": [
            {
                // part 1
                "img": "<path to the part's image under /resource/texture>",
                "xOffset": 0.0,
                "yOffset": 0.0,
                "width": 1.0,
                "height": 1.0
            },
            {
                // part 2
                // etc.
            }
        ]
    }
}
```

Each part's parameter `xOffset` and `yOffset` are optional, with default value 0. `xOffset` is the offset on x direction from the part's center to the element's center divided by element's `width`, i.e. `xOffset` of 0.5 means that the horizontal distance between part's center and the bounding box's center is 0.5 times the element's `width`. Similar relation applies to `yOffset` and element's `height`.

Each part's parameter `width` and `height` are also optional, with default value 1. `width` and `height` are the part's width and height divided by the element's width and height.
