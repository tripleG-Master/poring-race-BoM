# poringrace

A small raffle script to decide winners. Runs live at [GitHub Pages](https://borf.github.io/poringrace/).

## Sound effects

Add audio files (`.mp3`, `.ogg`, `.wav`, `.m4a`, `.aac`, `.opus`, or `.flac`) directly to `sfx/` and push them to the `main` branch. The game reads the public GitHub repository's `sfx/` directory when it loads, so new files appear in the sound selectors without editing `index.html`.

The four sound events can each be enabled or disabled and assigned any discovered sound. The repository must remain public for the browser to read its sound catalog.

## Project layout

- `index.html` contains the page structure.
- `styles.css` contains the presentation and layout.
- `js/race.js` contains race setup, scenery, animation, and winner handling.
- `js/sound-manager.js` discovers and plays sounds from `sfx/`.

