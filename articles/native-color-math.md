---
title: 'Native color math'
description: 'Tinting a whole theme from one color with color-mix(), and picking readable text with contrast-color(), without any JavaScript color math.'
category: 'technical'
date: '07-23-26'
read: '4 min read'
---

# Color math in CSS with color-mix() and contrast-color()

I used to do theme colors in JavaScript. Take the user's hex, convert it, work out its relative luminance, then decide whether the text on top should be black or white and toggle a class. It worked, but it was a lot of code for a decision the browser is better placed to make. Server rendering added a second problem. The server didn't know the user's color, so the page could paint with the wrong text color and fix itself after hydration.

CSS can do both parts now. `color-mix()` blends colors, and `contrast-color()` picks black or white text for a background. The demo below runs on one custom property, `--color`. Pick a color and everything else is derived from it.

<ColorMixLab />

## Tinting with color-mix()

`color-mix()` takes a color space and two colors with percentages:

```css
background-color: color-mix(in srgb, var(--color) 8%, #0f172a);
```

That's the card background in the demo: 8% of the picked color, the rest dark slate. Whatever you pick, the card stays dark and takes on a faint cast of it.

The text does the same thing in the other direction, mixing the accent into white:

```css
/* Small caption: more color, so it reads as secondary */
color: color-mix(in srgb, var(--color) 35%, #ffffff);

/* Title: mostly white, with a hint of color */
color: color-mix(in srgb, var(--color) 15%, #ffffff);
```

I like this more than picking grays by hand. The secondary text always belongs to the theme, and there's one variable to change instead of a palette to maintain.

One thing I'd do differently. I mixed in `srgb` because it's the space I knew. `oklab` usually gives more even results, especially between a saturated color and white, so that's what I'd reach for now.

## Picking text color with contrast-color()

`contrast-color()` takes a color and returns white or black, whichever contrasts more with it.

```css
.preview {
  --bg: color-mix(in srgb, var(--color) 25%, #0f172a);
  background-color: var(--bg);
  color: contrast-color(var(--bg));
}
```

Pass it the same color you paint the background with. It can't see what's actually behind the text, only the color you hand it. My first version of the demo got this wrong. It passed the raw accent instead of the darker mix, so a bright yellow produced black text on a dark block.

How good is "black or white"? Better than I expected. Against any solid color, one of the two always reaches at least about 4.6:1, which clears WCAG AA for normal text. For mid-tones it only just clears it, though. It also knows nothing about transparency, so text on a see-through background over an image is still your problem.

An earlier draft of the spec, `color-contrast()`, let you pass a list of candidate colors. The version browsers implemented is simpler and only returns black or white. If your design uses an off-black or a warm white, you still have to handle that yourself.

## Wiring it up in React

React only holds the color. The input writes it into `--color` on the card, and CSS works out the rest:

1. The color input updates state.
2. The component sets `--color` in its inline style.
3. Every `color-mix()` and `contrast-color()` underneath resolves again.

There's no luminance function and no class toggling. In the demo I animate `--color` with Motion, so a new color eases in instead of snapping, but that's optional. A plain inline style works the same way.

To be precise about what this saves: the browser still recalculates styles on the main thread. What goes away is my own JavaScript doing color math, and the server and client disagreeing, because the CSS resolves the same way in both.

## Support and a fallback

`color-mix()` works in all current browsers. `contrast-color()` is much newer, so check current support before you depend on it, and give older browsers a fixed version:

```css
.preview {
  background-color: #0f172a;
  color: #ffffff;
}

@supports (color: contrast-color(red)) {
  .preview {
    --bg: color-mix(in srgb, var(--color) 25%, #0f172a);
    background-color: var(--bg);
    color: contrast-color(var(--bg));
  }
}
```

If I were building theming from scratch today, this is where I'd start. One variable, a few mixes, and `contrast-color()` on anything that sits on a fill.
