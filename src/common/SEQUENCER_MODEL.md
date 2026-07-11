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

`velocity` is an authored per-note emphasis multiplier, not a kit-channel
setting. The default is `1`, meaning 100% of the selected kit channel's level.
Values below or above `1` can create ghost notes and accents, such as `0.5`
for 50% or `1.25` for 125%. The supported authored range is currently clamped
to `0` through `2`.

Pattern data may omit `velocity` when it is `1`. The normalized in-memory note
state keeps `velocity: 1` so reducers and selectors can use a simple shape.

## Tempo and playback feel

Tempo and playback feel are stored separately from pattern note data.

```text
tempo
  bpm
  swing
  humanize
```

`bpm` and `swing` are deterministic playback timing settings. `humanize` is a
playback-time transform: authored notes stay on the exact pattern grid, while
the scheduler applies deterministic seeded Gaussian timing offsets and per-note
velocity variation for each note occurrence. `humanize: 0` is an exact bypass.
The current maximum setting uses a 20ms timing standard deviation and a 12%
velocity standard deviation, with bounded output.

Per-note authored velocity is applied as the input to the humanize velocity
transform. In effect, playback uses the note's authored multiplier first and
then applies deterministic humanize variation before the audio router sets the
per-voice gain.

## Pattern packs

Factory pattern content is selected separately from kits. A pattern pack is a
named bank of related pattern slots, currently matching the app's eight-pattern
workflow. Loading a pattern pack updates pattern lanes, pattern timing, notes,
tempo/swing, and kit-channel assignments for the selected kit. It must not
replace the selected kit, mutate kit channel/sample data, or overwrite the
user's Humanize setting.

Kit preset loading is the inverse operation: it replaces kit channels/samples
and rebuilds lane assignments for the currently loaded pattern content, but it
must not replace pattern lanes, notes, tempo, swing, or humanize.

```text
patternPack
  id
  name
  bpm
  swing
  patternNames[]
  patternSettings[]
    timeSignature
      beatsPerBar
      beatUnit
    bars
    stepsPerBeat
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

userSample
  id
  name
  createdAt
  sourceName
  sourceType
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

`sample` is the normalized entity used by kit channels. `userSample` is the
persisted user-facing library metadata used by the sample selector and sample
manager. The audio payload for uploaded, edited, and recorded samples is stored in
IndexedDB and mirrored in the in-memory sample store under `userSample.id`.
Older persisted user-sample lists may contain bare string ids; reducers should
continue to normalize those entries when they are renamed or otherwise edited.

Sample editing is non-destructive. Trimming or normalizing a factory sample
creates a new `userSample` and a corresponding `sample` entity rather than
mutating the source sample. The current editor supports waveform selection,
auto-select, trim, normalize, original/edited preview, and save-as naming.
Trim applies a tiny fade only at the end boundary to avoid blunting drum
attacks. User samples can be renamed, previewed, and deleted through the Kit
workspace sample manager, but deletion is disabled while the sample is assigned
to a channel.

Recorded device-audio samples are user samples. The recording dialog stores the
final sample as WAV data in IndexedDB and assigns it to the selected kit channel
through the same channel-sample flow used by uploads and edited samples.

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
