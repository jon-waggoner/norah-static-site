# Sky Pilot

A 2D side-scrolling flight simulator built with p5.js for a 10-year-old.

## How It Works

- The player flies a red plane from left to right across a procedurally generated landscape.
- **Controls:** UP arrow (or W) to climb, DOWN arrow (or S) to descend. SPACE to start or restart.
- Each level starts on a runway. Press SPACE to take off (the plane gets an initial upward boost).
- The world scrolls automatically — the player only controls vertical movement.
- **Obstacles:** Buildings rise from the ground, birds fly at various altitudes. Hitting either one crashes the plane.
- At the end of each level (100% distance) a landing runway appears. The player must descend and touch down on the runway to complete the level.
- **Landing succeeds** if the plane touches the runway with vertical speed < 5 and angle < 0.5 radians. Otherwise it crashes.
- After a successful landing, the next level starts automatically after a short delay. Each level increases scroll speed (+0.5 per level) and adds more obstacles.
- Crashing shows an explosion particle effect and the player's progress percentage. Press SPACE to retry the same level.

## Key Assumptions

- **No build step.** Plain HTML + JS served as static files.
- **p5.js from CDN.** Same version as Star Catcher: `https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js`.
- **Keyboard-controlled.** Arrow keys / WASD for flight, SPACE to start/restart. No mouse interaction during gameplay.
- **Full-viewport canvas.** Fills the browser window, resizes with `windowResized()`.
- **No external assets.** The plane, obstacles, mountains, clouds, and runways are all drawn with p5 shapes. No images or fonts.
- **Base scroll speed is 9** with +0.5 per level. Controls (lift/gravity) are tuned to feel responsive at this speed.
- **Level length is 6000 units.** The landing runway starts at 5200 and is 800 units long. Obstacles are generated between the takeoff safe zone and a buffer before the landing zone.
- **Obstacle counts:** ~6 buildings + ~24 birds at level 1, scaling by +3 buildings and +8 birds per level.
- **Parallax scrolling.** Mountains scroll at 0.3x speed, clouds at 0.5x, ground/obstacles at 1x.
- **Game menu.** This game lives at `/flight/` and the root `index.html` is a landing page linking to all games. The "Back to Games" link points to `/`.
