# Star Catcher

A falling-objects catching game built with p5.js for a 10-year-old.

## How It Works

- Colorful stars fall from the top of the screen. The player moves a basket with their mouse to catch them.
- Each star caught is worth 1 point.
- 20% of falling objects are a picture of a dog (dog.png) instead of a star. The dog is worth 3 points and shows a floating "+3" text when caught.
- The player has 5 lives (hearts). Missing a falling object loses a heart. Losing all 5 ends the game.
- Every 10 points the level increases. Higher levels mean faster falling speed and more frequent spawns.
- Catching any object produces a colored particle burst.
- The background is a dark night sky with twinkling stars.
- Click to restart after game over.

## Key Assumptions

- **No build step.** This is plain HTML + JS served as static files. No bundler, no npm.
- **p5.js from CDN.** Loaded via `https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js` in index.html.
- **dog.png** is an 80x80 transparent PNG cutout of a brown Newfoundland puppy. It is loaded in `preload()` and must be served over HTTP (not file://) for p5's `loadImage` to work.
- **Mouse-controlled.** The basket follows `mouseX`. The cursor is hidden via `noCursor()`.
- **Full-viewport canvas.** The game fills the browser window and resizes with `windowResized()`.
- **No external dependencies** beyond p5.js. No fonts, no other images, no CSS frameworks.
- **Game menu.** This game lives at `/star-catcher/` and the root `index.html` is a landing page linking to all games. The "Back to Games" link points to `/`.
