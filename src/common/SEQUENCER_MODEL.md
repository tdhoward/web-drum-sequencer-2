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
  patternPackId
  arrangementPatternIds[][]
  tempoChanges[]
```

`patternIds` lists the pattern slots available to the current project, while
`arrangementPatternIds` is the ordered Song-workspace playback sequence. Each
outer-array entry is one song column, and its inner array lists every pattern
that starts together in that column. Pattern IDs are unique within a column. An
empty inner array preserves an intentionally empty column and plays back as a
silent one-bar rest.

When a column contains patterns with different lengths, each pattern plays once
and the column lasts as long as its longest pattern. A shorter pattern is silent
for the remainder of the column; it does not loop. The next column starts after
the longest pattern finishes.

The trailing empty editor column is derived UI and is never stored until it is
dragged among the arranged columns, at which point it becomes an intentional
empty column and a new trailing editor column is derived.

A saved song stores both its pattern-pack reference and its selected-kit
reference. Loading a saved song restores that kit before loading the song's
pattern content and arrangement. The user may select another kit after the song
has loaded; kit swapping remains a non-destructive mapping operation and does
not rewrite the pattern notes.

```text
savedSong
  id
  name
  contentHashAlgorithm
  contentHashVersion
  contentHash
  selectedKitId
  kitContentHash
  patternPackId
  patternPackContentHash
  arrangementPatternIds[][]
  tempoChanges[]
```

`id` is the stable local identity of the saved-song library entry, while
`contentHash` identifies the exact musical-content revision that was saved.
`selectedKitId` and `patternPackId` resolve the song's dependencies in the local
library. Their corresponding content hashes record the exact dependency
revisions used to calculate the song hash and to create a self-contained export.

Persisted arrangements from the earlier single-pattern model migrate from
`string | null` columns to `[string] | []` columns. Saved songs that predate
`selectedKitId` should migrate by using the kit that was selected when the old
state is loaded, with the default kit as the final fallback.

`tempoChanges` is aligned with the stored arrangement columns. Its first entry
is always a BPM number; later entries are either a BPM change or `null` to keep
using the most recent tempo. Tempo-marker selection is transient workspace UI
state and is not part of the saved song.

During Song playback, the transport publishes the active BPM, governing tempo
marker, and current column start time. The master BPM control uses that live
state in every workspace. Editing it updates the governing marker, preserves
the current beat by re-anchoring the column under the new BPM, and selectively
cancels and reschedules audio sources that have not begun yet. Already sounding
voices are not interrupted.

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

Changing a pattern's timing does not delete notes that fall outside the newly
visible grid. Those notes remain in state so they can be restored if the pattern
returns to a longer signature, but compatibility selectors, rendering code, and
the audio scheduler must treat notes outside the active pattern length as
inactive. For example, when a one-bar pattern changes from 4/4 to 3/4, notes on
beat 4 are preserved but must not be shown or played.

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
  contentHashAlgorithm
  contentHashVersion
  contentHash
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
can be reused by many songs. A song export packages snapshots of both its
selected kit and its pattern pack. The kit snapshot includes its referenced
sample payloads. These snapshots make the exported song self-contained without
changing the normalized live in-app state model; import resolves the snapshots
to global library objects and then makes the saved song reference those objects.

```text
kit
  id
  name
  contentHashAlgorithm
  contentHashVersion
  contentHash
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
  alignmentOffset (seconds, defaults to 0)
  byteLength
  contentHashAlgorithm
  contentHashVersion
  contentHash

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

Each sample may store an `alignmentOffset` in seconds from its beginning. Zero
preserves normal playback. The waveform's alignment mode clamps the value to the
decoded sample duration and offers drag/tap placement, reset, and 10 ms steps.
For a note whose beat time is `T`, playback begins at `T - alignmentOffset` so
the marker lands on the beat. The scheduler expands its lookahead by the offset;
at transport startup it clamps source start times to the current Web Audio time
instead of passing a negative or already elapsed scheduling time.

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

## Content hashes and duplicate imports

Drumkits, pattern packs, and songs use deterministic musical-content hashes for
duplicate detection. A hash identifies the entity's musical behavior rather
than its local library identity or presentation metadata. Consequently, local
IDs, display names, filenames, URLs, timestamps, and transient runtime state do
not affect these hashes. Two differently named entities with the same musical
content are duplicates under this definition.

Local IDs and content hashes have separate responsibilities and neither
replaces the other:

```text
local ID      = stable identity of a mutable entry in this installation's library
content hash  = portable identity of one immutable musical-content revision
```

Reducers, selectors, UI state, and normalized entity relationships continue to
use local IDs. A local entity keeps the same ID when it is edited, while its
content hash changes to identify the new revision. Multiple local entries may
also have the same content hash when their musical content is identical but
their presentation metadata, such as their names, differs.

Exports use hashes as portable dependency and payload keys because local IDs
have meaning only within one installation. Import first verifies and looks up
each content hash. If matching content exists, import reuses that entity's local
ID; otherwise, it assigns a new local ID and stores the imported snapshot. This
keeps runtime relationships stable while making local ID collisions irrelevant
to interchange.

SHA-256 is the initial hash algorithm. Although no finite hash can guarantee
mathematical uniqueness, SHA-256 provides practical global uniqueness for this
use case and is available through the browser's Web Crypto API. Every hash input
starts with an entity-type and schema-version marker, such as
`wds:kit:musical-content:v1`, so a later model change can introduce a new hash
version without changing the meaning of existing hashes.

### Sample hashes

The app calculates a sample's SHA-256 hash from all of its raw encoded bytes
when the sample is created or imported. It stores the hash, algorithm/version,
and byte length alongside the sample metadata and persists them with the sample
payload. Raw-byte hashing detects exact sample assets; it does not attempt to
recognize equivalent audio stored with different encodings.

The full byte content is hashed only once. Drumkit hashes use the stored sample
hashes and never reread or decode their sample payloads. Byte length may be used
as a quick lookup filter, but neither byte length nor a partial sample is
sufficient to declare a duplicate. An imported manifest may supply hashes for
fast matching, but import must verify each supplied sample hash against the
included bytes before trusting it.

### Canonical entity content

Each entity is projected into an explicit canonical representation before it is
hashed. The representation normalizes defaults, writes object fields in a fixed
order, preserves semantically meaningful array order, sorts set-like values such
as tags, omits `undefined`, and rejects non-finite numbers. Reference fields in
this canonical representation and in exported manifests use the referenced
entity's content hash rather than a machine-local ID; normalized runtime state
continues to use local IDs.

A drumkit hash includes channel order, percussion/lane metadata, channel audio
settings, sample alignment offsets, and the stored content hash of every
referenced sample. It excludes kit, channel, and sample IDs as well as sample
names, filenames, and URLs.

A pattern-pack hash includes tempo and swing, ordered pattern settings, ordered
lane metadata, and notes sorted and represented by their semantic pattern,
lane, step, pitch, and velocity values. Canonical pattern and lane positions
replace local pattern, lane, and note IDs. A pattern-pack hash never includes or
depends on a drumkit.

A song hash includes its normalized arrangement and tempo changes together with
the content hashes of its selected drumkit and pattern pack. It uses these
dependency hashes instead of `selectedKitId` and `patternPackId`, and excludes
the song's ID and name. Therefore, changing either referenced musical snapshot
changes the exported song's hash, while renaming or assigning new local IDs does
not.

A saved song retains both forms of each dependency reference. The local IDs
locate the current library entries during ordinary use, and the dependency
hashes record the revisions present when the song was saved. If a referenced
local entry has since changed content, the hash mismatch can be used to load an
available archived revision, use the current revision and mark the song as
changed, or ask the user which revision to use. A song export always includes
the hashed snapshots needed to reproduce the saved revision.

The dependency structure is:

```text
raw sample bytes -> sample hash -> drumkit hash
pattern content ----------------> pattern-pack hash
drumkit hash + pattern-pack hash + arrangement/tempo -> song hash
```

### Standalone kit bundles

The Kit workspace exports the selected kit as a versioned, GZIP-compressed
`.wds-kit` bundle. The decompressed content contains a JSON manifest for the kit,
its ordered channel snapshot, and its referenced sample metadata, together with
base64-encoded copies of the raw sample payloads. Payload keys are sample
content hashes, so a sample referenced more than once is stored only once.
Import requires the GZIP wrapper; uncompressed `.wds-kit` files are invalid.

Import parses the complete file and verifies every raw sample payload and the
canonical kit hash before changing Redux state. Matching user samples and saved
kit presets are reused by content hash. New imports receive collision-safe local
kit, channel, and sample IDs, their sample payloads are stored in IndexedDB, and
the imported kit is then saved as a user preset and selected. Portable IDs from
the bundle are never treated as authoritative local IDs.

### Import and export plan

1. Calculate and persist a full raw-byte sample hash whenever a sample is
   uploaded, recorded, edited, created by migration, or imported.
2. Add versioned canonical projection and hashing functions for samples,
   drumkits, pattern packs, and songs, with fixture tests proving that local ID
   and name changes do not change musical-content hashes.
3. Store entity content hashes in library metadata and index entities by entity
   type, hash algorithm/version, and content hash for constant-time duplicate
   lookup.
4. Export a manifest containing the song snapshot, drumkit snapshot,
   pattern-pack snapshot, sample payloads, and all dependency hashes.
5. On import, validate and migrate the manifest, verify every included sample's
   full raw-byte hash, recalculate the canonical drumkit and pattern-pack hashes,
   and reuse matching global library entities instead of creating duplicates.
6. Recalculate and verify the song hash from the resolved drumkit hash,
   pattern-pack hash, arrangement, and tempo changes. Save the imported song
   with the resolved `selectedKitId` and `patternPackId`, then restore that kit
   and pattern pack when the song is loaded.

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
