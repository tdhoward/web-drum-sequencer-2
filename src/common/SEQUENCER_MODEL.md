# Sequencer model

The app stores the musical document in a normalized, kit-aware model. Selected-
kit and note view models still adapt lane assignments for older UI call sites,
but resolved channels always carry their complete velocity-layer partition.
Runtime audio code does not fall back to channel-level sample or alignment
fields. New model work should build on the domain objects below.

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
beat 4 are preserved but must not be shown or played. These inactive notes are
also excluded from standalone pattern-pack exports rather than becoming hidden
portable data.

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

`velocity` is an authored MIDI-style integer, not a kit-channel setting. The
default is `64`, which preserves the prior 100% level. Values 1 through 127 are
audible and select one velocity layer; 0 is reserved for silent migrated data.
The Pattern editor authors values from 1 through 127.

Velocity gain preserves the app's earlier 0%-200% anchors with a piecewise
linear conversion: 0 is silent, 32 is 50%, 64 is 100%, and 127 is 200%.

Pattern data may omit `velocity` when it is `64`. The normalized in-memory note
state keeps `velocity: 64` so reducers and selectors can use a simple shape.

`note.id` is local normalized-state identity used by reducers, rendering, and
audio scheduling. It is not musical content and is not portable. Serialized
pattern-pack notes omit it; normalization generates a stable local ID from the
note's lane, pattern, and event position before the note enters entity state.

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

Per-note authored velocity is the input to the humanize transform. Humanize
clamps and rounds the effective velocity to 0-127. Playback uses that same
integer to select exactly one channel velocity layer and to calculate the
per-voice gain. Layer trim is multiplied into that voice gain before channel
gain and before the channel's dry and reverb paths.

The complete playback order is:

```text
authored MIDI velocity
  -> deterministic humanize variation
  -> clamp and round to an effective 0-127 integer
  -> select exactly one velocity layer
  -> effective-velocity gain × layer trim (dB converted to gain)
  -> channel gain, mute, and solo
  -> dry pan path + channel reverb send
  -> master output
```

Pitch and fine pitch are channel-level source detune. Pan, reverb, channel gain,
mute, and solo never vary by velocity layer.

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

Standalone `.wds-pattern-pack` exports contain musical note properties such as
beat, pitch, and non-default velocity, but not normalized `note.id` values.
Writers and readers use bundle v2 and encode velocity as a MIDI-style integer,
omitting the default value 64. Unsupported bundle versions are rejected.
Export retains only lanes currently represented by the selected kit and filters
each pattern slot's events to its active time-signature, bar, and step length.
Notes on unresolved lanes and notes beyond the active pattern length remain in
the live editing state but are not portable. Import verifies the pack's
musical-content hash first and then generates local note entity IDs as the notes
are normalized. No exported relationship refers to an individual note by ID.

## Global kit library

Kits are global library objects. Songs reference a selected kit, but the same kit
can be reused by many songs. A song export packages snapshots of both its
selected kit and its pattern pack. The kit snapshot includes its referenced
sample payloads. These snapshots make the exported song self-contained without
changing the normalized live in-app state model; import resolves the snapshots
to global library objects and then makes the saved song reference those objects.

Portable Songs use the `.wds-song` extension and GZIP-compressed JSON. Export
captures the live arrangement, tempo markers, Kit, referenced sample bytes, and
active Pattern pack, including unsaved authored Pattern changes. Pattern data
uses the same portability boundary as `.wds-pattern-pack`: runtime note IDs,
unresolved lanes, and notes beyond active Pattern lengths are omitted. Import
verifies the complete dependency hash chain before changing Redux content,
resolves matching Kit, Pattern pack, and Song content by hash, and remaps the
saved Song to collision-safe local dependency IDs when new objects are needed.
Song writers and readers use bundle v2; unsupported versions are rejected
before changing application state.

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
  velocityLayers[]
  gain
  pan
  muted
  solo
  reverb
  pitchCoarse
  pitchFine

velocityLayer
  id
  sampleId
  maxVelocity (inclusive)
  alignmentOffset (seconds, defaults to 0)
  trimDb (defaults to 0)

sample
  id
  name
  url
  sourceType
  fileName
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

Every normalized Kit channel has at least one velocity layer. Layer order is
velocity order, the first range starts at 1, and each later range starts one
above the preceding layer's inclusive `maxVelocity`. Boundaries are strictly
increasing and the final layer always ends at 127. Layer IDs are stable local
identity. A legacy one-sample channel normalizes deterministically to
`<channel-id>:layer:1`, covering 1-127.

The layer containing velocity 64 is the reference layer used by the Kit-row
sample selector, main waveform, displayed duration, default editor selection,
and Hit-button audition. Playback selectors resolve every layer so scheduled
notes can choose from the complete partition. Channel-level `sample`,
`sampleId`, and `alignmentOffset` fields are accepted only at normalization and
persistence-migration boundaries; normalized Redux channels and resolved
runtime channel view models do not store or publish those fields.

The Kit-row view model exposes that resolved reference layer, its inclusive
range, the total layer count, and the reference sample's URL, content revision,
load status, and alignment. The main row sample selector changes only this
layer. Its waveform is a single editor button: multi-layer rows show an
informational `×N` badge beside duration, include the layer count in the
accessible name, and show alignment markers only for a non-default reference
offset. Beat Alignment is edited in the unified editor rather than inline in
the row.

`sample` is reusable normalized asset metadata referenced by velocity layers.
It does not contain channel-specific alignment. `userSample` is the persisted
user-facing library metadata used by the sample selector and sample manager.
The audio payload for uploaded, edited, and recorded samples is stored in
IndexedDB and mirrored in the in-memory sample store under `userSample.id`.
Older persisted user-sample lists may contain bare string ids; reducers should
continue to normalize those entries when they are renamed or otherwise edited.

Each velocity layer stores an `alignmentOffset` in seconds from its sample
beginning. Zero preserves normal playback. The waveform's alignment mode clamps
the value to the decoded sample duration and offers drag/tap placement, reset,
and 10 ms steps.
Audio Edit and Beat Alignment share the selected layer's waveform, with
mode-specific Pointer Event behavior. While a waveform edit is pending, Beat
Alignment displays the rendered trim/normalize output. The draft preserves the
alignment point in source-sample coordinates; the final offset subtracts the
leading trim duration and clamps to the rendered sample duration.
For a note whose beat time is `T`, playback begins at `T - alignmentOffset` so
the marker lands on the beat. The scheduler expands its lookahead by the offset;
at transport startup it clamps source start times to the current Web Audio time
instead of passing a negative or already elapsed scheduling time.
For layered channels, scheduler lookahead uses the maximum alignment offset
across all layers, while the actual source start uses only the selected layer's
offset. Hit-button audition uses velocity 64 and therefore the reference layer.

Sample loading status is runtime-only state keyed by sample ID. It is excluded
from persistence and musical-content hashes; reloading the application starts
with an empty status map even though reusable sample metadata remains stored.
Startup and reconnect loading scan every unique velocity-layer sample in the
active Kit. Preset and import loading do the same for incoming channels.
Concurrent requests for one sample share the same IndexedDB/fetch/decode
operation, while each resolved layer exposes the status of its own sample so a
failure in one layer does not change another layer's result.

Sample editing defaults to non-destructive save-copy behavior. Trimming or
normalizing a factory sample creates a new `userSample` and a corresponding
`sample` entity rather than mutating the source sample. An existing user sample
may instead be explicitly replaced under its current ID, which updates every
layer that references it. Replacement eligibility requires the ID to exist in
the user-sample registry and not in the factory catalog. Replacement alignment
transforms apply to matching layers in active channels and saved user Kit
presets; affected saved Kit content hashes are invalidated.
The editor supports waveform selection, auto-select, trim, normalize,
original/edited preview, and save-as naming. Its transactional primary action
is `Apply`, `Save Copy & Apply`, or `Replace & Apply`. Uploading or recording
inside the editor creates a library asset without assigning it to the channel
until the complete valid layer draft is applied. Failed sample persistence
does not commit that draft.
Trim applies a tiny fade only at the end boundary to avoid blunting drum
attacks. User samples can be renamed, previewed, and deleted through the Kit
workspace sample manager, but deletion is disabled while the sample is assigned
to a layer. Usage text includes every matching active channel layer and its
inclusive velocity range, and the deletion action repeats the usage check so
stale UI state cannot remove a referenced sample.

Recorded device-audio samples are user samples. The recording dialog stores the
final sample as WAV data in IndexedDB and assigns it to the selected channel's
reference layer through the same explicit reference-layer action used by main-
row uploads and sample selection.

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
starts with an entity-type and schema-version marker. Raw sample fingerprints
remain `wds:sample:musical-content:v1`; current Kit, Pattern Pack, and Song
musical-content hashes use their respective v2 markers. Keeping versions per
entity type allows a model change to advance the affected hashes without
invalidating unchanged raw sample fingerprints.

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
settings, and each channel's complete ordered velocity-layer list. Every layer
contributes its sample content hash, inclusive maximum velocity, alignment
offset, and trim dB. It excludes kit, channel, sample, and layer IDs as well as
derived layer labels, sample names, filenames, and URLs.

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

Kit writers and readers use bundle v2. Each channel carries its complete layer
partition and every layer references portable sample metadata. Import
resolves samples by verified content hash and rewrites each layer to local
sample IDs and URLs. Unsupported bundle versions are rejected.

Import parses the complete file and verifies every raw sample payload and the
canonical kit hash before changing Redux state. Matching user samples and saved
kit presets are reused by content hash. New imports receive collision-safe local
kit, channel, and sample IDs, their sample payloads are stored in IndexedDB, and
the imported kit is then saved as a user preset and selected. Portable IDs from
the bundle are never treated as authoritative local IDs.

### Bundle and persistence schema boundaries

Redux persistence version 10 migrates version-9 channels and saved Kit presets
to velocity layers, moving any sample-level alignment to the generated layer.
Version 11 converts normalized notes and saved Pattern Packs from legacy gain
multipliers to MIDI-style integer velocity. These migrations are the only
runtime entry point for the superseded persisted shapes.

Kit, Pattern Pack, and Song file writers and readers support bundle v2 only.
Kit snapshots contain complete ordered layer partitions and deduplicate sample
payloads by content hash. Pattern Pack snapshots use integer velocity and omit
the default 64. Song snapshots embed both current dependency snapshots.
Readers validate the version, manifest shape, payload hashes, entity hashes,
and dependency hash chain before changing application state; pre-v2 files are
rejected rather than migrated.

## Kit channel mapping

Kit switching should be treated as an explicit lane-to-kit-channel assignment,
not as note mutation. The resolver produces an inspectable mapping result with
confidence and reasons. Kit and Pattern Pack selector changes apply high- and
medium-confidence results directly; low-confidence or unresolved results open
the mapping review dialog before changing kit or pattern state. The dialog can
accept a fallback, choose another target channel, or leave a lane silent.

The selected-kit UI view model still adapts assignment lane IDs for sequencing
call sites, but `kitChannelAssignments` is the source of that mapping.

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

The Pattern grid and transport still consume `notes[channelId][patternIndex]`
and a selected-kit channel array keyed by assignment lane IDs. The selected-kit
view model resolves sample metadata and loading state for every velocity layer,
plus explicit `referenceVelocityLayer*` fields for Kit-row presentation. It
does not flatten a reference sample or alignment back onto the channel.

The audio scheduler consumes the resolved `velocityLayers` array directly.
Missing layer partitions are invalid normalized state, not a one-sample
fallback case.
