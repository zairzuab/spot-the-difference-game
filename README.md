# Spot the Difference — Three Scenic Hunts

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/zairzuab/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/zairzuab/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

A complete spot-the-difference game for the make.fun bounty
[Make the best spot the difference game](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).

Two near-identical pictures side by side. One hides **7 differences**. Find
them all, scene after scene.

## The three scenes

1. **Lantern Night Market** — paper lanterns, fruit stalls and a cat on a crate
   under a crescent moon.
2. **Coral Reef** — a turtle, tropical fish and branching corals in deep water.
3. **Sunset Harbour** — a lighthouse, sailboats and gulls over a golden sea.

Every picture is original art, painted in code (canvas, no image files, no
network). The differences are fair and findable: a colour change, a missing
object, an added object, a moved detail, a flipped fish.

## How to play

- **Click** a difference on either picture — a gold ring appears on both.
- **Arrow keys** move the crosshair cursor, **Enter** marks the spot.
- **H** uses a hint (3 per scene, costs 25 points).
- **L** toggles the magnifier lens.
- **P** pauses, **M** mutes. Wrong clicks cost 10 points; a fast finish earns
  a time bonus. Your best score is saved in the browser.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Node 22+ and a desktop browser. No build step, no downloads while playing.

## Files

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library.
- `game/` — the game: `index.html` plus ES modules under `src/` (scenes,
  world, renderer, input, audio, screenshots).
- `screenshots/` — real renders of the game's own code.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
