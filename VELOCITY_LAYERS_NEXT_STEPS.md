# Velocity Layers: Next Steps

## Purpose

This document is an implementation handoff for adding velocity-layered samples
to Kit channels without cluttering the main Kit workspace. It records the
agreed product and architecture decisions, breaks the work into manageable
phases, and defines acceptance criteria for each phase.

An agent picking up this work should read:

1. This document.
2. `PROJECT_NOTES.md`.
3. `src/common/SEQUENCER_MODEL.md`.
4. The tests adjacent to any file being changed.

Unless explicitly asked to complete the entire feature, implement one phase at
a time and keep lint, type checking, tests, and the production build passing at
the end of that phase.

## Locked decisions

### Channel and layer model

- Every normalized Kit channel has a `velocityLayers` array.
- A newly created or legacy channel has one layer covering velocities 1-127.
- Single-layer channels keep the current simple UI and behavior.
- `sampleId` is owned by the layer, not duplicated as writable channel state.
- Each normalized layer contains:
  - A stable local `id`.
  - A `sampleId`.
  - An inclusive upper velocity boundary.
  - A beat-alignment offset in seconds.
  - A volume trim in dB.
- Pitch, fine pitch, pan, reverb, main gain, mute, and solo remain channel-level
  settings.
- There is no delay effect in the current app. Adding one is outside this
  feature's scope; if it is added later, it should remain channel-level.

Recommended normalized types:

```ts
type VelocityLayerInput = {
  id?: string;
  sample?: string;
  sampleId?: string;
  maxVelocity?: number;
  alignmentOffset?: number;
  trimDb?: number;
};

type VelocityLayer = {
  id: string;
  sampleId: string;
  maxVelocity: number;
  alignmentOffset: number;
  trimDb: number;
};

type KitChannel = {
  // Existing identity, metadata, and channel-level settings.
  velocityLayers: VelocityLayer[];
};
```

`KitChannelInput` may temporarily accept the old channel-level `sample`,
`sampleId`, and `alignmentOffset` fields at normalization/import boundaries.
Normalized `KitChannel` state should not use those fields as a second source of
truth.

### Range representation and invariants

- Layer order is velocity order.
- The first layer implicitly starts at 1.
- A subsequent layer starts at the preceding layer's `maxVelocity + 1`.
- The last layer must end at 127.
- Upper boundaries must be strictly increasing.
- Ranges are inclusive.
- A channel must always contain at least one layer.
- Gaps and overlaps should be impossible through normal reducer/editor actions,
  rather than merely reported after invalid state has been stored.
- Layer IDs are local identity and must not affect musical-content hashes.
- A normalized legacy layer ID should be deterministic, for example
  `${channel.id}:layer:1`; do not generate a new random ID on every
  normalization or selector run.

Recommended pure operations:

- `normalizeVelocityLayers(channelInput, samples)`
- `getVelocityLayerRange(layers, index)`
- `getVelocityLayerForVelocity(layers, velocity)`
- `getReferenceVelocityLayer(layers)`
- `splitVelocityLayer(layers, layerId)`
- `removeVelocityLayer(layers, layerId)`
- `setVelocityLayerBoundary(layers, layerId, maxVelocity)`
- `validateVelocityLayers(layers)`

Adding a layer should split the selected layer near its midpoint and clone its
sample, alignment, and trim. Adding a layer therefore does not change the sound
until the user assigns or adjusts it. Removing a layer should merge its range
into an adjacent layer deterministically.

### MIDI-style velocity

- Normalized note velocity uses MIDI-style integers.
- Velocity 64 is the default and represents the current 100% level.
- Velocities 1-127 select velocity layers.
- Velocity 0 is reserved for silent legacy data and selects no audible layer.
- The normal note-velocity editor should author values from 1 through 127.
- Serialized current-format pattern notes may omit velocity when it is 64.

Use a gain conversion that preserves the existing 0%-200% anchors:

```ts
const noteVelocityToGain = (velocity: number): number => (
  velocity <= 64
    ? velocity / 64
    : 1 + ((velocity - 64) / 63)
);
```

Expected anchors:

```text
0   -> silent
32  -> 50%
64  -> 100%
127 -> 200%
```

Convert legacy multipliers with the inverse piecewise mapping:

```text
0.00 -> 0
0.50 -> 32
1.00 -> 64
1.25 -> approximately 80
2.00 -> 127
```

Humanize should start from the authored integer velocity, apply its
deterministic variation, clamp and round to 0-127, and then use that effective
integer for both layer selection and voice gain.

### Reference layer

The reference layer is the layer containing velocity 64. It drives:

- The main Kit-row sample selector.
- The main waveform.
- The duration shown on the main waveform.
- The default target for Beat Alignment.
- The channel Hit button.
- The layer initially selected when the unified editor opens.

Changing range boundaries can therefore change which layer is the reference
layer; no separate `isMain` flag should be stored.

On a multi-layer channel, changing a sample from the main Kit-row selector
changes only the reference layer. After a successful change, show a
non-blocking notification such as:

> Changed the Medium 56-100 sample. The other 2 velocity layers were left
> unchanged.

This applies to selecting, uploading, or recording through the main Kit-row
sample selector. Changes made inside the unified editor do not need this
additional scope notification because the selected layer and range are already
visible there. Do not add a confirmation dialog for the main-row operation.

### Main waveform behavior

- Clicking or tapping the waveform opens the unified sample and velocity
  editor.
- Remove the current Align button.
- Do not add an overflow button or separate Beat Alignment/Velocity Layers
  editing surfaces.
- Keep sample duration in the lower-right corner.
- For multi-layer channels, show a compact `×N` badge immediately left of the
  duration.
- The badge is informational, not a separate touch target. It should use
  `pointer-events: none` so tapping it still activates the waveform.
- Show the beat-alignment guide/marker only when the reference layer has a
  non-default offset. Treat offsets within the existing small display epsilon
  as zero.
- The waveform's accessible name should report the layer count when the channel
  has multiple layers.

### Unified sample and velocity editor

The existing Sample Editor modal becomes the only place to manage channel
samples, velocity layers, per-layer alignment, layer trim, and destructive or
non-destructive waveform edits.

- Use one selected-layer context throughout the dialog. The selected layer
  drives sample assignment, range and trim controls, alignment, waveform audio
  editing, and preview.
- Initially select the reference layer containing velocity 64.
- Repeat the selected layer, range, and sample name visibly near the top of the
  editing workspace.
- On desktop, use a compact layer rail beside the selected-layer workspace.
- On narrow screens, replace the rail with a compact selector such as
  `Layer 2 of 3 · Medium · 56-100`, followed by touch-sized Add and Remove
  controls.
- For a single-layer channel, keep the editor visually simple and show only a
  subdued `Velocity Layers: 1` / `Add Layer` affordance rather than a large
  empty layer rail.
- A layer row should clearly show a derived label, range, sample name, and trim:

```text
Soft       1-55      Ghost Snare       -3.0 dB
Medium    56-100     Snare Main         0.0 dB
Hard     101-127     Snare Rim         -1.5 dB
```

Conceptual desktop layout:

```text
Edit Open Hat Samples

┌──────────────────────┬──────────────────────────────────────┐
│ VELOCITY LAYERS      │ Selected: Medium · 56-100 · 100%=64 │
│                      │                                      │
│ Soft       1-55      │ Sample  [ Open Hat Medium       ▾ ] │
│ Medium    56-100  ●  │                                      │
│ Hard     101-127     │ [ Audio Edit ] [ Beat Alignment ]   │
│                      │                                      │
│ + Add layer          │ ┌──────────────────────────────────┐ │
│ Remove layer         │ │        Shared waveform           │ │
│                      │ └──────────────────────────────────┘ │
│                      │ Contextual mode controls            │
│                      │ Range: 56-100   Trim: 0.0 dB        │
└──────────────────────┴──────────────────────────────────────┘

                                         [Cancel] [Apply]
```

- Provide the selected layer's sample picker in the workspace so every layer,
  including non-reference layers, can use factory, uploaded, recorded, or
  edited samples.
- Use a local draft with Apply/Cancel. Redux and playback must never observe an
  incomplete velocity partition.
- Removing the final layer is disabled.
- A reasonable maximum such as eight layers may be enforced.
- Labels such as Soft, Medium, and Hard are derived presentation, not musical
  data. Suggested derivation:
  - One layer: Main.
  - Two layers: Soft, Hard.
  - Three layers: Soft, Medium, Hard.
  - More layers: Layer 1, Layer 2, and so on, unless a clearer fixed vocabulary
    is introduced.

#### Shared waveform and editing modes

- Use one waveform for both audio editing and beat alignment.
- Add a compact segmented mode control:
  - `Audio Edit`
  - `Beat Alignment`
- The explicit mode is required because trim-selection gestures and alignment
  placement gestures conflict on touch screens.
- Reduce the desktop waveform from its current approximate 14-15rem height to
  about 9-10rem, subject to visual testing. This creates room for layer controls
  without making the dialog substantially taller.
- In Audio Edit mode, retain the current capabilities:
  - Auto Select.
  - Trim to Selection.
  - Normalize.
  - Reset.
  - Original and edited preview.
- In Beat Alignment mode:
  - Show and enable the alignment marker.
  - Allow tap or drag placement with Pointer Events.
  - Show the alignment readout.
  - Provide Reset, -10 ms, and +10 ms controls.
- A non-default alignment marker may remain faintly visible in Audio Edit mode,
  but it must only be interactive in Beat Alignment mode.
- Keep velocity range and layer trim available as selected-layer settings
  outside the mode-specific control row.
- Alignment is measured from the beginning of the final rendered sample. If a
  pending trim removes time from the sample beginning, subtract that trim-start
  duration from the draft alignment and clamp it to the rendered duration.
- When pending waveform edits exist, Beat Alignment should display and preview
  the pending rendered output so the marker describes the sample that will
  actually be saved.

#### Apply, cancel, and audio-asset semantics

- Range, trim, alignment, and sample assignments stay in the dialog draft until
  Apply.
- Cancel discards the channel/layer draft.
- Uploading or recording may create a user-sample library asset immediately;
  canceling the dialog may leave that asset unused, but must not assign it to
  the channel.
- Only one layer may have pending waveform buffer edits at a time. Switching
  layers while trim/normalize edits are dirty must require the user to discard
  or finish those edits.
- If no waveform buffer edit is pending, the primary action is `Apply`.
- If a non-destructive waveform edit is pending, the primary action becomes
  `Save Copy & Apply`.
- If replacement is explicitly selected, the primary action becomes
  `Replace & Apply`.
- Saving a new edited copy updates only the selected layer in the draft before
  the complete valid draft is committed.
- Replacing an existing user sample keeps its existing global semantics:
  every channel/layer referencing that user sample sees the replacement.
- When replacement trims the sample beginning or changes its duration, apply
  the same alignment transformation/clamping to every referencing layer whose
  sample bytes are being replaced, including references in saved user Kit
  presets where applicable.
- Replacement messaging should state that global effect and, where practical,
  report how many layers use the sample.
- Selected-layer preview should include channel pitch and layer trim before
  channel-level gain/routing.
- If asynchronous sample save/replace fails, do not commit the channel draft.

### Touch and accessibility

- No essential information may exist only in hover or native `title`
  tooltips.
- Use visible labels, menus, state, and notifications for essential feedback.
- Keep `title` only as optional desktop supplementation.
- Use Pointer Events for mouse, touch, and pen behavior.
- Interactive touch targets should be approximately 44 by 44 CSS pixels.
- The whole layer row should be tappable and have a strong selected state.
- Do not make precision dragging the only way to edit a boundary. Provide
  numeric input and/or large decrement/increment controls.
- On narrow screens, use a full-height modal/sheet with scrollable content and
  sticky Apply/Cancel actions.
- The Audio Edit/Beat Alignment mode control must have a visible active state
  and work with touch and keyboard input.
- Important notifications should be announced through an appropriate live
  region.
- Suggested accessible labels:
  - Main-row waveform: `Edit Open Hat samples; 3 velocity layers`
  - Dialog waveform in Audio Edit mode: `Edit Medium 56-100 sample waveform`
  - Dialog waveform in Beat Alignment mode:
    `Set Medium 56-100 sample beat alignment`

## Compatibility policy

`PROJECT_NOTES.md` permits breaking old saved application data during the
revamp. This plan nevertheless preserves the immediately preceding supported
formats because current state and exported bundles are likely to exist:

- Add Redux persistence migrations from version 9 to the new current schema.
  If the layer model and integer velocity domain ship in separate releases,
  assign each change its own new persistence version; never amend a migration
  version that has already shipped.
- Read current v1 Kit, Pattern Pack, and Song bundles and normalize them into
  the new model.
- Write only the new current bundle formats after the change.
- Do not add compatibility for formats older than the currently supported v1
  bundles unless a fixture or explicit requirement exists.

If the maintainer chooses to drop this compatibility, remove the v1 reader and
v9 migration tasks deliberately and update this document; do not leave
half-migrated behavior.

## Implementation phases

### Phase 1: Pure velocity and layer domain

**Goal:** Establish tested types, constants, normalization, selection, gain,
and range operations without changing UI behavior.

Tasks:

- Add the MIDI-style velocity constants and pure conversion helpers.
- Add `VelocityLayerInput` and `VelocityLayer` types.
- Add pure layer normalization and invariant helpers.
- Normalize a legacy one-sample channel to one 1-127 layer.
- Add pure split, remove, boundary-change, lookup, and reference-layer
  functions.
- Extend sequencer model invariant checks to cover layer references and ranges.
- Decide one canonical location for these helpers and export them through the
  appropriate `index.ts`.
- Add focused unit tests for all boundary cases.

Likely files:

- `src/common/sequencerModel.ts`
- `src/common/sequencerModel.test.ts`
- `src/common/sequencerModelInvariants.ts`
- `src/common/sequencerModelInvariants.test.ts`
- A new focused velocity-layer utility module and test file
- `src/common/index.ts`

Acceptance criteria:

- A legacy channel normalizes deterministically to one layer ending at 127.
- Layer lookup is correct at 1, every shared boundary, 64, and 127.
- Velocity 0 selects no audible layer.
- Split/remove/boundary operations always return a complete non-overlapping
  partition.
- `noteVelocityToGain` has exact 0, 32, 64, and 127 anchors.
- Invalid inputs normalize or fail according to one documented policy.

### Phase 2: Normalized Redux model and persistence

**Goal:** Make layers the single source of sample assignment in normalized
state.

Tasks:

- Change normalized `KitChannel` to require `velocityLayers`.
- Update channel reducers to add, replace, and modify layers atomically.
- Replace `setChannelSample` internally with a layer-aware sample action.
  Preserve a compatibility action only if it delegates unambiguously to the
  reference layer.
- Update `createSamplesState`, sample reducers, default state creation, channel
  addition, and channel replacement to traverse every layer.
- Move beat alignment updates from `Sample` to a targeted channel layer.
- Ensure sample metadata remains reusable and contains no channel/layer
  alignment state in the new model.
- Introduce a runtime sample-load status map or equivalent selector state.
  Do not make load status part of musical layer content or hashes.
- Add the next persistence migration for the layer model:
  - Convert active normalized Kit channels.
  - Copy the old referenced sample alignment into each new legacy layer.
  - Convert saved user Kit presets.
- Update model documentation.

Likely files:

- `src/common/sequencerModel.ts`
- `src/common/defaultSequencerState.ts`
- `src/common/channels/*`
- `src/common/samples/*`
- `src/common/presets/*`
- `src/common/patternPacks/*`
- `src/store.ts`
- `src/common/SEQUENCER_MODEL.md`

Acceptance criteria:

- Normalized channels have no writable channel-level sample/alignment source.
- All current factory presets normalize to one valid layer per channel.
- New channels start with one 1-127 layer using the current default sample.
- Existing version-9 state migrates to a valid layered channel model.
- Reloading normalization does not regenerate layer IDs.
- Model invariants pass after add, remove, preset load, and migration.

### Phase 3: Note velocity UI, humanize, and playback

**Goal:** Play exactly one correct layer with preserved gain and timing.

Tasks:

- Change note reducers, actions, selectors, and Pattern UI to author integer
  velocity values.
- Add the next persistence migration for velocity:
  - Convert normalized note entities from multipliers to integers.
  - Convert saved user Pattern Packs containing note velocities.
  - If this phase is released together with Phase 2, these transformations may
    share one new migration version; otherwise use a later version.
- Update the velocity popover to display MIDI velocity prominently and,
  optionally, the equivalent percentage secondarily.
- Reset velocity to 64.
- Update humanize to output a deterministic clamped integer velocity.
- Resolve layer sample URLs/content hashes in the playback channel selector.
- Select exactly one layer from effective velocity.
- Use the maximum alignment offset across a channel for scheduler lookahead.
- Use the selected layer's alignment offset for actual source start time.
- Apply `noteVelocityToGain(effectiveVelocity) * dbToGain(trimDb)` at the voice
  gain stage before channel gain.
- Make Hit buttons audition velocity 64 and therefore the reference layer.
- Preserve pitch detune, pan, reverb, mute/solo, and channel gain behavior.
- Add scheduler and router tests before changing UI integrations.

Likely files:

- `src/common/notes/*`
- `src/components/Toggles/*`
- `src/services/humanize.ts`
- `src/services/humanize.test.ts`
- `src/services/audioScheduler.ts`
- `src/services/audioScheduler.test.ts`
- `src/services/audioRouter.ts`
- `src/services/audioRouter.test.ts`
- `src/common/channels/channels.selectors.ts`

Acceptance criteria:

- Velocities on either side of a boundary play the expected different sample.
- Velocity 64 selects the reference layer.
- Humanize can cross a layer boundary deterministically.
- A longer alignment offset in any layer cannot be scheduled late.
- Only the selected layer plays; there is no crossfade or stacking.
- Layer trim changes both dry and reverb-send level before channel gain.
- Single-layer playback matches current behavior apart from the intentional
  integer quantization.

### Phase 4: Unified editor shell and layer configuration

**Goal:** Turn the existing Sample Editor into a draft-based channel sample
editor with one selected-layer context.

Tasks:

- Change modal props from one flattened channel sample to channel plus layer
  collection and initial selected layer ID.
- Initially select the reference layer.
- Extract the reusable visual sample picker from its current channel-connected
  behavior so it can target a draft layer.
- Add the desktop layer rail and responsive mobile layer selector.
- Keep the single-layer presentation compact while exposing `Add Layer`.
- Implement layer selection, Add, Remove, Apply, and Cancel.
- Implement split/merge behavior through the pure domain helpers.
- Implement shared-boundary editing without allowing gaps or overlaps.
- Implement selected-layer sample assignment for existing factory/user samples.
- Add dB trim controls with a visible neutral 0 dB state.
- Reduce the waveform height to make room for layer controls while keeping trim
  handles usable.
- Reset the loaded waveform and selection correctly when the selected layer's
  sample changes.
- Add responsive layout, sticky mobile actions, and touch-sized controls.
- Add component tests for core draft transitions and accessibility labels.

Likely files:

- `src/components/SampleEditorModal/*`
- `src/components/SampleSelect/*`
- `src/components/KitChannelList/*`
- `src/common/channels/*`
- `src/common/userSamples/*`

Acceptance criteria:

- The editor opens on the velocity-64 layer.
- The selected layer, range, and sample are always visible.
- Cancel leaves channel layers unchanged.
- Apply commits one valid partition atomically.
- Add initially preserves the audible result.
- Remove never leaves an uncovered velocity.
- One layer cannot be removed.
- Single-layer channels do not show a large empty layer rail.
- Essential layer operations work without hover or precision dragging.
- The 1/127 boundary cases and a three-layer example are covered by tests.

### Phase 5: Main Kit-row waveform and selector integration

**Goal:** Expose the feature without adding persistent clutter to the Kit row.

Tasks:

- Update the Kit channel selector/view model to expose the reference layer,
  layer count, reference sample URL/hash, range, duration inputs, and alignment.
- Keep the existing main sample selector for the reference layer.
- Route every main sample assignment flow to the current reference layer.
- Show the multi-layer notification after a successful reference-layer sample
  change.
- Remove the current Align button.
- Add the `×N` badge to the left of duration.
- Hide the alignment indicator at the default offset.
- Make waveform click/tap open the unified editor on the reference layer.
- Include the multi-layer count in the waveform's accessible name.
- Add pointer, keyboard, and event-propagation tests.

Likely files:

- `src/components/KitChannelList/*`
- `src/components/SampleWaveform.component.tsx`
- `src/components/SampleWaveform.component.test.tsx`
- `src/components/SampleSelect/*`
- `src/common/channels/channels.selectors.ts`
- Existing flash-message actions/components

Acceptance criteria:

- A single-layer row looks and behaves like the current row except that Align is
  removed and alignment is edited in the unified dialog.
- A three-layer row visibly shows `×3` beside the reference sample duration.
- Tapping the waveform or badge area opens the unified editor.
- Alignment markers are absent at zero and visible at non-zero offsets.
- Changing the main selector affects only the velocity-64 layer and produces a
  clear non-blocking notification.
- No overflow or additional small touch control is added to the waveform.

### Phase 6: Unified waveform modes and transactional save workflow

**Goal:** Integrate Beat Alignment and waveform audio editing into the unified
draft editor with clear save semantics.

Tasks:

- Add the `Audio Edit` / `Beat Alignment` segmented mode control.
- Keep one shared waveform and make its pointer behavior mode-specific.
- Retain Auto Select, Trim to Selection, Normalize, Reset, and original/edited
  preview in Audio Edit mode.
- Add alignment placement, readout, Reset, -10 ms, and +10 ms in Beat Alignment
  mode.
- Keep alignment changes in the layer draft until Apply.
- Display the pending rendered output in Beat Alignment mode when trim or
  normalize edits are enabled.
- Transform and clamp alignment when a leading trim or duration change alters
  the final sample coordinate system.
- Allow a non-default alignment marker to remain faintly visible but
  non-interactive in Audio Edit mode.
- Guard layer switching while waveform audio edits are dirty.
- Support upload and recording. Newly created library assets may exist before
  Apply, but channel assignment remains in the draft.
- Implement the dynamic primary actions:
  - `Apply`
  - `Save Copy & Apply`
  - `Replace & Apply`
- Save a new edited copy and attach it only to the selected draft layer before
  committing the complete layer draft.
- Keep replace-existing behavior global to the underlying user sample.
- On replacement, transform/clamp alignment for every layer and saved user Kit
  preset that references the replaced sample.
- Make replacement eligibility and existing-sample naming layer-specific.
- Do not commit the channel draft when asynchronous sample persistence fails.
- Include selected layer trim in contextual preview.
- Refresh the correct waveform when a sample fingerprint changes.
- Add tests for mode switching, pointer behavior, saving a copy, replacement,
  canceling, failed persistence, and dirty layer switching.

Likely files:

- `src/components/SampleEditorModal/*`
- `src/components/KitChannelList/*`
- `src/components/SampleWaveform.component.tsx` or waveform helpers extracted
  from it
- `src/common/userSamples/*`
- `src/services/sampleEditing*`

Acceptance criteria:

- Audio Edit and Beat Alignment operate on the same selected layer and
  waveform.
- Touch trim gestures cannot accidentally move alignment, and alignment
  gestures cannot alter trim selection.
- Cancel discards draft configuration changes.
- Configuration-only changes use `Apply`.
- Pending non-destructive edits use `Save Copy & Apply`.
- Explicit replacement uses `Replace & Apply`.
- Saving a copy changes only the selected layer.
- Replacing a shared user sample refreshes every referencing layer.
- Leading trims preserve the intended alignment point relative to the rendered
  sample, with out-of-range values clamped safely.
- A failed sample save/replace leaves channel state unchanged.
- Single-layer editing remains compact while offering both waveform modes.

### Phase 7: Sample loading, lifecycle, and management

**Goal:** Ensure every layer's sample is loaded, tracked, protected, and
recoverable.

Tasks:

- Load every unique layer sample on preset load, app startup, reconnect, import,
  upload, recording, and sample edit.
- Replace one-channel/one-sample startup assumptions.
- Track load success/failure per sample or resolved layer rather than one
  ambiguous channel boolean.
- Update Sample Manager usage labels to scan every layer in every active
  channel.
- Disable deletion while any layer references the sample.
- Report channel and layer/range information in usage text where space allows.
- Ensure renaming and fingerprint changes refresh every reference.
- Deduplicate decoding/loading work for a sample used in multiple layers.
- Add tests for multi-layer usage and deletion protection.

Likely files:

- `src/index.tsx`
- `src/common/channels/channels.actions.ts`
- `src/common/samples/*`
- `src/services/sampleStore.ts`
- `src/components/SampleManagerModal/*`
- `src/common/userSamples/*`

Acceptance criteria:

- Refreshing the app loads every layer needed for playback.
- One failed optional layer does not incorrectly report another layer as
  loaded.
- A user sample used only by a non-reference layer cannot be deleted.
- Shared samples are loaded once and may be used by multiple layers.

### Phase 8: Presets, hashes, and bundle import/export

**Goal:** Make layered kits and integer velocities fully portable and
deterministically hashable.

Tasks:

- Update current Kit preset serialization to include every layer's local sample
  URL/reference, range boundary, alignment, and trim.
- Update preset load and content-hash preparation to rebuild all layer sample
  entities.
- Update Kit export to collect every unique sample referenced by every layer.
- Update Kit import to resolve each exported layer sample by content hash and
  rewrite every layer to its local sample ID/URL.
- Add the ordered layer list to Kit canonical musical content:
  - Sample content hash.
  - Inclusive maximum velocity.
  - Alignment offset.
  - Trim dB.
- Exclude layer IDs and derived labels from hashes.
- Update Pattern Pack canonical content for integer velocities.
- Update Song bundles because they embed both Kit and Pattern Pack snapshots.
- Introduce current v2 bundle writers for Kit, Pattern Pack, and Song.
- Preserve v1 readers:
  - V1 Kit: create one 1-127 layer and copy sample alignment.
  - V1 Pattern Pack: convert velocity multipliers; omitted velocity becomes 64.
  - V1 Song: apply both conversions to embedded dependencies.
- Refactor the current global musical-content hash version if necessary so Kit
  and Pattern Pack schema changes do not invalidate unrelated raw sample
  fingerprints without intent.
- Add round-trip, duplicate detection, payload de-duplication, validation, and
  malformed-range tests.

Likely files:

- `src/common/presets/*`
- `src/services/libraryContentHash.ts`
- `src/common/contentHash/*`
- `src/common/kitBundles/*`
- `src/common/patternPackBundles/*`
- `src/common/songBundles/*`
- Related file-service tests

Acceptance criteria:

- A three-layer Kit round-trips with all samples, boundaries, alignment, and
  trims intact.
- Reusing one sample in several layers exports one payload.
- A v1 Kit imports as an equivalent single-layer Kit.
- A v1 Pattern Pack preserves expected note loudness after conversion.
- Kit hashes change for sample, range, alignment, or trim changes.
- Kit hashes do not change for layer ID or derived label changes.
- Song dependency hashes remain internally consistent.

### Phase 9: Documentation and full regression

**Goal:** Finish the feature with model documentation, coverage, and static
verification.

Tasks:

- Update `src/common/SEQUENCER_MODEL.md` with:
  - Integer note velocity semantics.
  - Layer structure and invariants.
  - Reference-layer behavior.
  - Gain/trim signal order.
  - Humanize and layer-selection order.
  - Bundle/hash schema changes.
- Update `PROJECT_NOTES.md` current-model baseline.
- Update README features if appropriate.
- Remove obsolete channel-sample and sample-alignment compatibility paths that
  are no longer needed after migration/import boundaries.
- Review all `channel.sample`, `channel.sampleId`, `sample.alignmentOffset`, and
  velocity multiplier assumptions with `rg`.
- Run focused tests followed by the complete static verification suite.

Required verification:

```text
npm run typecheck
npm run lint
npm run test
npm run build
```

Do not start a local development server or probe localhost unless the user
explicitly requests it.

Acceptance criteria:

- No production path assumes one channel has exactly one sample.
- No essential action depends on hover.
- All agreed single-layer and multi-layer behaviors are documented.
- Type check, lint, full tests, and production build pass.

## Cross-cutting test matrix

Every phase should add focused tests rather than deferring all coverage to the
end. Before declaring the feature complete, cover at least:

### Model

- One layer: 1-127.
- Two and three contiguous layers.
- Lookups exactly below, on, and above shared boundaries.
- Invalid duplicate, descending, missing-final, and out-of-range boundaries.
- Split first/middle/last layer.
- Remove first/middle/last layer.
- Velocity 64 reference layer changes after a boundary edit.

### Audio

- Velocities 1, 32, 64, 127.
- Velocity 0 is silent.
- Per-layer sample selection.
- Per-layer trim combined with note and channel gain.
- Per-layer alignment and maximum scheduler lookahead.
- Humanize repeatability and boundary crossing.
- Immediate Hit audition uses velocity 64.

### UI and input

- Main waveform tap opens the unified editor on the reference layer.
- `×N` badge and duration ordering.
- Default alignment indicator hidden.
- Unified editor layer add/remove/select/apply/cancel.
- Desktop layer rail and compact mobile selector.
- Audio Edit/Beat Alignment mode switching.
- Mode-specific waveform pointer behavior.
- Alignment against a pending trimmed output.
- Alignment transformation after leading trim for save-copy and shared-sample
  replacement.
- Boundary editing without precision drag.
- Main-selector notification.
- Dirty waveform-edit layer switch.
- Dynamic Apply, Save Copy & Apply, and Replace & Apply actions.
- Single-layer UI has no layer badge or large empty layer rail.

### Persistence and portability

- Version-9 Redux state through the new current persistence schema.
- User Kit and Pattern Pack migration.
- V1 Kit, Pattern Pack, and Song imports.
- V2 round trips.
- Shared sample payload de-duplication.
- Sample-manager deletion protection for non-reference layers.
- Content-hash inclusion/exclusion rules.

## Feature-complete checklist

- [ ] Pure velocity/layer domain and invariants.
- [ ] Normalized Redux model and persistence migrations.
- [ ] MIDI-style note velocity UI and playback.
- [ ] Correct layer selection, trim, and alignment scheduling.
- [ ] Unified sample and velocity editor with draft layer configuration.
- [ ] Main waveform `×N` badge, reference alignment indicator, and touch
      behavior.
- [ ] Main-selector scoped-change notification.
- [ ] Shared Audio Edit/Beat Alignment waveform modes.
- [ ] Transactional Apply/Save Copy/Replace routing.
- [ ] Multi-layer sample loading and Sample Manager usage protection.
- [ ] Kit/Pattern Pack/Song preset and bundle portability.
- [ ] Content-hash schema updates.
- [ ] Documentation and full static verification.

## Explicit non-goals

- MIDI file or device input/output.
- Velocity crossfades.
- Playing or stacking multiple layers for one note.
- Round-robin sample selection.
- Random sample variation.
- Per-layer pitch, pan, reverb, delay, or channel gain.
- A new delay effect.
- Custom user-authored layer names.
- Drag-only editing or interactions that require hover.
