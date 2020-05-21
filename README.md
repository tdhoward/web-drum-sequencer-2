# Web Drum Sequencer

A browser-based drum machine and sequencer built with the Web Audio API, React, and Redux.  This was originally created by Stu Freen, whose excellent work can be seen [here](https://github.com/stufreen/web-drum-sequencer). This current repo is under development to add more features than perhaps were originally intended, as well as to spend more time exploring React, Redux, and the like.

## Demo
The original web app can be found here:  https://wds-1.com

## Features
 * Swap drum samples
 * Choose drum samples from file
 * Pattern selector to save up to 8 patterns per drum kit
 * BPM and swing control
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
 * [web-drum-sequencer](https://github.com/stufreen/web-drum-sequencer)
 * [React-Select](https://github.com/JedWatson/react-select)
 * [Webaudio-Controls](https://github.com/g200kg/webaudio-controls)
 * Chris Wilson's article [here](https://www.html5rocks.com/en/tutorials/audio/scheduling/)
 * [Voxengo impluse response](https://www.voxengo.com/impulses/)
 * [Jost* typeface](https://github.com/indestructible-type/Jost)
 * [Draggable](https://shopify.github.io/draggable/)
