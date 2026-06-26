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

## Pattern packs

Factory pattern content is selected separately from kits. A pattern pack is a
named bank of related pattern slots, currently matching the app's eight-pattern
workflow. Loading a pattern pack updates pattern lanes, notes, tempo/swing, and
kit-channel assignments for the selected kit. It must not replace the selected
kit or mutate kit channel/sample data.

Kit preset loading is the inverse operation: it replaces kit channels/samples
and rebuilds lane assignments for the currently loaded pattern content, but it
must not replace pattern lanes, notes, tempo, or swing.

```text
patternPack
  id
  name
  bpm
  swing
  lanes[]
    laneId
    name
    percussionType
    articulation
    register
    tags[]
  notes
```

The Pattern workspace pack dropdown selects the whole pack, such as `Hip Hop
Swing`; the existing pattern buttons select a pattern slot inside that pack.
Individual pattern import/export can be added later on top of the same lane and
note model.

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

kitChannelAssignment
  id
  kitId
  laneId
  kitChannelId
  confidence

kitChannel
  id
  kitId
  laneId
  name
  percussionType
  articulation
  register
  tags[]
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

`percussionType` is a controlled, machine-readable role used for kit
translation. The first vocabulary is intentionally small: `bass_drum`,
`snare_drum`, `closed_hi_hat`, `open_hi_hat`, `pedal_hi_hat`, `clap`,
`rimshot`, `tom_high`, `tom_mid`, `tom_low`, `ride_cymbal`, `crash_cymbal`,
`cymbal`, `shaker`, `tambourine`, `cowbell`, `clave`, and
`generic_percussion`.

User-created channels can start as `generic_percussion` and be corrected later.
Factory kits should provide explicit `name` and `percussionType` values so
patterns can be remapped to another kit without rewriting note data.

## Kit channel mapping

Kit switching should be treated as an explicit lane-to-kit-channel assignment,
not as note mutation. The resolver produces an inspectable mapping result with
confidence and reasons so a later review dialog can ask the user to approve or
correct uncertain assignments.

The current compatibility UI still reads `kitChannel.laneId`, but
`kitChannelAssignments` is the forward path for applying a resolved mapping.

```text
kitChannelMappingResult
  mappings[]
    laneId
    targetKitChannelId
    confidence
    reason
  unresolved[]
    laneId
    reason
```

## Compatibility selectors

The existing UI and audio scheduler still expect legacy-shaped `channels[]` and
`notes[channelId][patternIndex]` data. Keep using the compatibility selectors for
those call sites until the UI is migrated to the domain model directly.
