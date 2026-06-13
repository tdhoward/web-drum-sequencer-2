# Sequencer model

The app now stores the musical document in a normalized, kit-aware model. The
current UI still uses compatibility selectors that expose the older channel and
note shapes, but new model work should build on the domain objects below.

## Songs

A song is the user's current musical project. It owns pattern selection and the
currently selected kit, but it does not own the global kit library.

```text
song
  id
  name
  selectedKitId
  selectedPatternId
  patternIds[]
```

## Patterns and lanes

A pattern owns musical events and timing information. It references logical
`laneId` values, not concrete kit-channel IDs. This lets the same pattern play
through different kits.

```text
pattern
  id
  name
  timeSignature
    beatsPerBar
    beatUnit
  bars
  stepsPerBeat
  laneIds[]
```

The current default pattern remains one bar of 4/4 with four steps per beat,
which preserves the existing 16-step behavior. Other signatures such as 3/4,
5/8, and 6/8 can be represented by changing `timeSignature` and
`stepsPerBeat`.

## Notes

Notes are normalized separately from patterns. A note points to a pattern and a
logical lane.

```text
note
  id
  patternId
  laneId
  step
  pitch
  velocity
```

## Global kit library

Kits are global library objects. Songs reference a selected kit, but the same kit
can be reused by many songs. Import/export can later package a song together
with a snapshot of its selected kit and referenced samples without changing the
live in-app state model.

```text
kit
  id
  name
  channelIds[]

kitChannel
  id
  kitId
  laneId
  name
  sampleId
  gain
  pan
  muted
  solo
  reverb
  pitchCoarse
  pitchFine

sample
  id
  name
  url
  sourceType
  fileName
```

## Compatibility selectors

The existing UI and audio scheduler still expect legacy-shaped `channels[]` and
`notes[channelId][patternIndex]` data. Keep using the compatibility selectors for
those call sites until the UI is migrated to the domain model directly.
