# Web Drum Sequencer

A browser-based drum machine and sequencer built with the Web Audio API, React, and Redux.  This was originally created by Stu Freen, whose excellent work can be seen [here](https://github.com/stufreen/web-drum-sequencer). This current repo is under development to add more features than perhaps were originally intended, as well as to spend more time exploring React, Redux, and the like.

## Demo
The original web app can be found here:  https://wds-1.com

## Features
 * Kit, Pattern, and Song workspaces
 * Swap drum samples
 * Choose drum samples from file
 * Record drum samples from the user's device
 * Edit kit samples with a waveform modal
 * Auto-select, trim, normalize, preview, and save edited samples
 * Rename, preview, and delete unused user samples
 * Pattern pack and pattern slot selectors
 * Per-note velocity/emphasis editing
 * BPM, swing, and humanize playback controls
 * Sample hit buttons
 * Gain and pan
 * Reverb
 * Mute and solo
 * Pitch shift
 * Preset system for saving and loading drum kits
 * Works offline with service worker and caching
 * Installable as PWA
 * Drag to reorder channels

## Circle CI status

[![CircleCI](https://circleci.com/gh/tdhoward/web-drum-sequencer-2.svg?style=svg)](https://circleci.com/gh/tdhoward/web-drum-sequencer-2)

## Installation

To run a local development server:
```
npm install
npm run start
```

To build a production version: `npm run build`

## Tests

```
npm run test
```

## Thank You
 * Original [web-drum-sequencer](https://github.com/stufreen/web-drum-sequencer)
 * [React-Select](https://github.com/JedWatson/react-select)
 * [Webaudio-Controls](https://github.com/g200kg/webaudio-controls)
 * Chris Wilson's article [here](https://www.html5rocks.com/en/tutorials/audio/scheduling/)
 * [Voxengo impulse response](https://www.voxengo.com/impulses/)
 * [Jost* typeface](https://github.com/indestructible-type/Jost)
 * [Draggable](https://shopify.github.io/draggable/)
