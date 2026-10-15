# Velocity Layers: Status and Follow-ups

## Status and document ownership

Reviewed against the repository on October 15, 2026. The original nine
implementation phases are implemented; this is now a maintenance reference,
not a queue of phases to implement again. The review found a layout difference
and lifecycle limitations listed below, so the former feature-complete
checklist should not be read as proof that every original criterion was met.

The filename is retained for existing references. Use:

- [PROJECT_NOTES.md](PROJECT_NOTES.md) for project direction and a short baseline.
- [SEQUENCER_MODEL.md](src/common/SEQUENCER_MODEL.md) for the authoritative model,
  playback, persistence, and portability contracts.
- This document for editor behavior, review findings, and follow-up verification.
- Source and adjacent tests to confirm current behavior before making changes.

Completed work includes the layer domain, Redux migrations, integer note
velocity, playback selection, unified editor, Kit-row integration, sample
loading and management, bundle/hash updates, and model documentation. The old
phase task lists and speculative file lists have been removed to avoid
duplicating those sources.

## Core design

The design remains sound: store a complete ordered velocity partition on each
Kit channel, select exactly one layer per note, and keep all sample editing in
one dialog with one selected-layer draft.

- Each layer owns `id`, `sampleId`, inclusive `maxVelocity`,
  `alignmentOffset` in seconds, and `trimDb`.
- Ranges cover 1-127 without gaps or overlaps. The first starts at 1, each
  subsequent range starts after the previous boundary, and the last ends at
  127. At least one layer is required.
- New and legacy one-sample channels receive one deterministic 1-127 layer.
  Local layer IDs do not contribute to musical-content hashes.
- Pitch, fine pitch, pan, reverb, channel gain, mute, and solo remain
  channel-level settings. Sample metadata is reusable and alignment-free.
- The layer containing velocity 64 is the reference layer for the main sample
  selector, waveform, duration, Hit audition, and initial editor selection.
  Moving a boundary can change this layer; no separate main-layer flag exists.

Notes use MIDI-style integers: 64 is the default (100% gain), 1-127 are audible,
and 0 preserves silent migrated data. The normal editor authors 1-127.
Humanize transforms the authored integer first; its clamped, rounded result
drives both layer selection and voice gain. Gain is `v / 64` through 64 and
`1 + (v - 64) / 63` above 64, preserving the 0%, 50%, 100%, and 200% anchors
at velocities 0, 32, 64, and 127. Layer trim multiplies voice gain before
channel gain and dry/reverb routing.

Scheduler lookahead accounts for the largest alignment offset across the
channel; actual playback uses only the selected layer's offset. Velocity 0
creates no voice. There is no crossfade or layer stacking.

### Range operations and limits

- Add splits the selected range at its midpoint and copies sample, alignment,
  and trim, preserving its sound. The editor selects the new upper half.
- A one-velocity range cannot be split. The editor disables Add at eight
  layers; this is an editor creation limit, not a bundle/schema limit.
- Remove merges into the preceding layer, except that removing the first
  layer extends the next layer down to 1. The last remaining layer cannot be
  removed.
- Boundary edits clamp between adjacent boundaries so every layer remains
  non-empty. Numeric controls avoid requiring precision dragging.
- Editor trim controls clamp to -24 through +12 dB. The model accepts finite
  trim values; those UI limits are not import validation limits.
- Normalization repairs missing/malformed boundaries deterministically and
  rejects more than 127 layers. Bundle readers validate partitions before
  import rather than silently repairing malformed files.

Types and pure operations live in
[velocityLayers.ts](src/common/velocityLayers.ts). Editor limits, labels, and
draft transitions live in
[SampleEditorModal.draft.ts](src/components/SampleEditorModal/SampleEditorModal.draft.ts).

## Kit-row and editor behavior

### Kit row

- The main sample selector changes only the current reference layer's sample.
  Successful select/upload/record flows announce that scope for multi-layer
  channels without a confirmation dialog.
- The waveform is one pointer- and keyboard-accessible editor button. Its
  accessible name includes the layer count for multi-layer channels.
- An informational `×N` badge appears immediately left of the duration for
  multi-layer channels. Both badges allow pointer events through to the button.
- The alignment indicator is hidden within the existing 0.5 ms display
  epsilon. Beat Alignment is edited in the dialog; there is no inline Align
  button or separate layer-editing surface.

### Selected-layer workspace

- Open on the reference layer. Sample assignment, range, trim, alignment,
  waveform edits, and preview all target the selected layer.
- Desktop currently uses a layer rail even for one layer. Narrow screens use
  a compact layer selector and Add/Remove controls, a full-height dialog, and
  sticky actions. See the single-layer layout follow-up below.
- The rail shows derived label, inclusive range, sample name, and trim. Labels
  are Main; Soft/Hard; Soft/Medium/Hard; or Layer 1, Layer 2, etc. They are
  presentation, not stored musical data.
- The workspace sample picker supports factory, uploaded, recorded, and edited
  samples for any layer. The selected layer/range is identified by the rail or
  mobile selector; the sample picker shows the assigned sample.
- One waveform serves Audio Edit and Beat Alignment. Explicit mode selection
  separates trim gestures from alignment gestures for mouse, touch, and pen.
- Audio Edit retains Auto Select, Trim to Selection, Normalize, Reset, and
  original/edited preview. Beat Alignment provides marker placement, a readout,
  Reset, -10 ms, +10 ms, and preview of pending rendered audio.
- A non-default alignment marker can remain visible in Audio Edit but is
  interactive only in Beat Alignment.
- Range and layer trim remain available outside mode-specific controls.
- Preview uses the selected sample with channel pitch, velocity-64 gain, layer
  trim, and channel routing; it does not select another layer based on velocity.

The draft stores alignment in source-sample coordinates. For pending leading
trim, the displayed/final alignment subtracts the trim start and clamps to the
rendered duration. Retaining the source point avoids accumulating errors as
trim boundaries change.

### Apply, Cancel, and shared assets

- Sample assignments, ranges, trim, and alignment remain in the local draft
  until Apply commits a complete valid partition.
- Cancel discards that draft. Uploading or recording may already have created
  a library asset, which can remain unused after Cancel.
- Only one layer has pending waveform edits at a time. Switching layers,
  adding/removing layers, or changing samples prompts before discarding dirty
  waveform edits. To retain them, use the primary save/apply action first;
  there is no separate per-layer buffer-edit queue.
- The primary action is `Apply`, `Save Copy & Apply`, or `Replace & Apply`.
  Saving a copy assigns the new asset only to the selected draft layer.
- Factory samples always save as user copies. Explicit replacement of a user
  sample keeps its asset ID and changes every reference globally. Leading-trim
  and duration alignment transforms apply to matching active layers and saved
  user Kit layers; affected saved Kit hashes are invalidated.
- Sample persistence must succeed before the channel draft is committed.
  **Atomicity covers the layer-partition update, not the entire asset/save
  flow.** A successful asset save or global replacement is not rolled back if
  a later apply step fails. Do not describe Cancel as undoing such a replacement.
- After saving succeeds, the editor clears pending waveform edits and retains
  the saved layer draft. An apply failure can be retried with `Apply` without
  saving the asset again or transforming alignment twice, even if preview
  loading is delayed or unavailable. Preview loading does not clear an apply
  error. A visible live notice explains whether Cancel keeps a saved copy or
  leaves a shared replacement in place.

Essential feedback must remain visible without hover, with accessible names,
keyboard controls, clear selection/mode state, touch-sized targets, and live
announcements for scope notifications. Static/component tests do not establish
that every responsive layout or touch interaction has been visually verified.

## Persistence and portability

These are separate version domains:

| Domain | Current contract |
| --- | --- |
| Redux persistence | v11; migration 10 adds layers to active channels and saved user Kits, migration 11 converts note and saved Pattern Pack velocity multipliers to integers |
| Kit, Pattern Pack, Song bundles | v2-only readers and writers; unsupported versions are rejected before changing application state |
| Raw sample fingerprint | Hash schema v1 |
| Kit, Pattern Pack, Song content hashes | Hash schema v2 |

Kit hashes include every ordered layer's sample content hash, boundary,
alignment, and trim, excluding local layer IDs. Kit/Song exports include every
referenced layer sample and deduplicate payloads by content hash. Pattern
serialization may omit default velocity 64.

Keep existing persistence migrations. Add a new version for future schema
changes rather than rewriting a shipped migration. Do not add pre-v2 bundle
readers without an explicit requirement and fixtures; the original rollout
did not require support for previously exported files.

## Follow-ups from this review

1. **Reconcile the single-layer layout requirement.** The original plan required
   a subdued Add Layer affordance instead of a rail for one layer. Current
   code and a component test deliberately keep the rail, and there is no
   repeated selected-layer summary above the workspace. Preserve this tested
   behavior for now; if the compact original layout is still desired, treat
   it as a focused UI change with updated tests and visual review. It should
   not remain both a locked requirement and a checked completion claim.
2. **Resolved: saved Kits protect samples from deletion.** Usage reporting and
   deletion guards include every layer in saved user Kits as well as active
   channels. Saved usage identifies the Kit, channel, layer, and inclusive
   range, with wrapping text that does not require hover. Regression tests
   cover a non-reference layer in an inactive saved Kit, action-level rejection,
   and deletion becoming available after the final reference is removed.
3. **Keep save failure guarantees precise.** Existing tests cover persistence
   failure before draft commit, plus Apply-only recovery after a successful
   copy or replacement with delayed/unavailable preview loading. Recovery
   preserves the draft and applies alignment transforms only once; the editor
   explicitly reports saved assets that Cancel cannot undo. If rollback after
   a successful replacement and a later apply failure becomes a requirement,
   design and test it explicitly; the current sequential flow does not provide it.

No additional velocity-layer implementation phase is needed merely to complete
the old task list. Saved-Kit deletion protection is now implemented; the layout
and rollback questions above remain explicit future decisions.
Browser/device listening and visual checks remain useful when the user
next runs the app; this review does not claim those checks were performed.

## Verification for future changes

Use adjacent tests for the affected area, then the full static suite for a
cross-cutting implementation change:

```text
npm run typecheck
npm run lint
npm run test
npm run build
```

Do not start a local development server or probe localhost unless explicitly
requested. For documentation-only edits, check claims against source/tests,
local links, and the diff; a full application build is not required.

Retain regression coverage for:

- Complete one/two/three-layer partitions; invalid boundaries; split/remove at
  first, middle, and last positions; one-velocity ranges; reference changes.
- Velocity 0 silence and 1/32/64/127 anchors; deterministic humanize boundary
  crossing; one selected voice; trim and alignment scheduling; Hit at 64.
- Draft add/remove/select/apply/cancel; main-row scope notification and badge;
  mode-specific pointer behavior; pending-trim alignment; dirty-edit guards.
- Save-copy isolation; shared replacement alignment; failed persistence;
  Apply-only retry after successful persistence and failed draft application;
  delayed/unavailable preview loading and persistent apply feedback;
  asset-only upload/record; per-sample loading; active and saved Kit
  non-reference usage guards; deletion after the final reference is removed.
- Redux migrations 10/11; v2 round trips and malformed/unsupported bundles;
  shared payload deduplication; content-hash inclusion/exclusion rules.

## Non-goals

MIDI file/device I/O, velocity crossfades, stacked layers, round-robin or random
sample selection, per-layer pitch/pan/reverb/channel gain, a new delay effect,
custom layer names, and drag-only or hover-dependent essential interactions
remain outside this feature's scope.
