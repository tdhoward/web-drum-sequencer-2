# PROJECT_NOTES.md

## Project overview

This project is WDS2, a fork/rework of the original `web-drum-sequencer` web app.

The current goal is not simply to preserve the old app. The goal is to modernize and reorganize the app into a cleaner drum sequencer with clearer separation between drum kits, patterns, and songs.

During this revamp phase, backwards compatibility with old saved app data is not required. It is acceptable to make breaking data-model changes if they simplify the architecture and support the new direction.

## Current product direction

The app should be organized around three main workspaces:

1. Kit workspace

   * Create, select, rename, delete, and duplicate drum kits.
   * Edit kit channels.
   * Each channel should be configurable independently.
   * Channel settings should include sample selection plus musical/mix properties such as gain, pan, reverb, and pitch where supported by the existing audio code.
   * Channel samples can be edited from the Kit workspace waveform. The current editor supports manual selection, auto-select, trim, normalize, original/edited preview, and save-as naming.
   * Sample edits are non-destructive: saving an edit creates a new user sample instead of overwriting a bundled factory sample or an existing user sample.
   * User samples can be managed from the Kit workspace. The current sample manager supports rename, preview, and deletion for unused user samples.

2. Pattern workspace

   * Edit beat patterns.
   * Patterns should reference logical lanes and resolve through the current kit, but pattern data should not contain full kit definitions.
   * Built-in rhythm content should be selected as human-readable pattern packs, such as `Hip Hop Swing`, with the existing pattern buttons selecting slots inside the loaded pack.
   * Pattern editing should stay focused on sequencing notes, timing, steps, accents/velocity if supported, and pattern-level behavior.

3. Song workspace

   * Arrange patterns into a song structure.
   * Song data should reference patterns and the selected/current kit as appropriate.
   * Song editing should not be responsible for kit design.

The Pattern and Song workspaces may show a compact display of the current kit, but full kit editing belongs on the Kit workspace.

Also, we should be able to swap Kits and still use the same Pattern. Patterns should remain attached to logical lanes, while the selected kit supplies channels/samples for those lanes. Kit channels now carry standardized percussion metadata such as `percussionType`, optional `articulation`, optional `register`, and optional `tags`. This lets the app resolve a pattern made for one kit onto another kit without rewriting the pattern notes.

## Important architectural direction

Kit data, pattern data, and song data should be decoupled.

Historically, the app has had overlap between "kit preset" selection and loading a larger pattern/preset state. That coupling should be removed. A kit preset should mean the drum kit configuration only. A pattern should mean the sequence/pattern data only. A song should mean arrangement data only.

Preferred model direction:

* A kit is a first-class object.
* A pattern is a first-class object.
* A song is a first-class object.
* Kit channels should have user-facing names separate from sample file names.
* Kit channels should have standardized percussion metadata. User-created channels can start as `generic_percussion` and be corrected through a simple control later.
* Kit switching should use an explicit lane-to-kit-channel assignment result, not mutate note data.
* Resolver output should be inspectable: proposed mappings, confidence, reasons, and unresolved lanes.
* Default rhythm content should live in pattern packs separate from kits.
* Loading a pattern pack should update pattern lanes, notes, tempo/swing, and kit-channel assignments, but it should not replace the current kit.
* Default model creation should be centralized.
* Avoid scattering hard-coded default kits, channels, patterns, and songs across multiple UI components.
* Avoid adding compatibility shims for old app data unless required.

Current model baseline:

* `src/common/percussion.ts` defines the controlled percussion vocabulary and the pure `resolveKitChannelMapping` resolver.
* `kitChannel.percussionType` is required by invariant checks and defaults to `generic_percussion` for new/legacy channels.
* `kitChannelAssignments` exists as the forward path for applying resolved lane-to-channel mappings.
* `src/patternPacks/index.ts` exposes factory pattern packs with human-readable names. The Pattern workspace dropdown loads a pack; the existing 1-8 pattern buttons select slots within that pack.
* Bundled factory presets use semantic channel IDs and explicit channel names/percussion metadata; `empty_channel` has been removed from factory preset data.
* The compatibility UI/audio path now exposes assignment lane IDs through `channelsSelector`, so loaded pack notes can play through the current kit without changing kit samples.
* Kit preset loading changes kit channels/samples/name and rebuilds assignments, but no longer replaces notes, pattern lanes, tempo, or swing.
* The master header includes BPM, Swing, and Humanize controls. `humanize` lives in tempo state as a playback-feel setting rather than authored pattern data.
* Humanize applies deterministic Gaussian timing offsets and per-note velocity variation during scheduling. The pattern grid remains exact, and `humanize: 0` is an exact bypass.
* Notes carry an authored `velocity` multiplier for per-note emphasis. `velocity: 1` means 100% of the selected kit channel's level and is the normalized in-memory default; serialized pattern-style data may omit default velocity values. The authored range is currently clamped to `0` through `2`, and the scheduler applies this authored value before humanize velocity variation.
* The compatibility note path preserves non-default note velocity values so scheduler-time playback transforms can use them.
* The Pattern grid exposes note velocity editing through a compact vertical popover. Touch and pen users long-press an active note; mouse users right-click a note, including an empty step to create a note and edit it; keyboard users can use Shift+Enter on a focused step. The popover edits note velocity only and leaves kit channel gain unchanged.
* The Kit channel list exposes channel sample editing by clicking the row waveform. The sample editor uses immutable audio-buffer helpers for trim/normalize/WAV encoding, applies only a tiny trim-end fade to avoid dulling drum attacks, and creates named user samples on save.
* `userSamples` now stores user-facing sample metadata records, while older persisted string entries are still normalized when edited. The audio data itself is stored in IndexedDB and mirrored in the in-memory sample store by sample id.
* The Kit workspace sample manager lists user samples, shows whether each sample is assigned to a channel, lets the user rename samples, previews samples through a dedicated preview channel, and only deletes samples that are not currently in use.

## UI direction

The app should have theme-consistent navigation between the main workspaces.

Preferred top-level pages/workspaces:

* Kit
* Pattern
* Song

The navigation could use tab-like buttons near the existing top controls, such as the Install button area, as long as it fits the visual style of the app.

The Kit page should become the only place for kit management. The Pattern and Song pages should show only current-kit selection.

The Pattern workspace should include:

* A pattern-pack dropdown for loading a named pack.
* The existing numbered pattern buttons for selecting one pattern slot inside the loaded pack.
* Pattern editing controls only; kit sample/channel editing should stay in the Kit workspace.

The Kit workspace should include:

* Kit preset selection.
* Compact channel editing rows for channel name, percussion type, sample selection, waveform/sample editing, pitch, pan, volume, reverb, mute/solo, and delete.
* A sample manager for user-created and imported samples. Broad sample-library work should stay here rather than inside Pattern or Song.

Current UI/component naming baseline:

* Workspace-level control bars should use `WorkspaceControls` names, such as `PatternWorkspaceControls` and `KitWorkspaceControls`.
* Pattern sequencing rows/headers should use `PatternChannel` names, such as `PatternChannelList` and `PatternChannelHeader`.
* Kit channel editing rows should use `KitChannelList`. Avoid generic names like `ChannelControls` for workspace-specific surfaces.
* Shared channel pieces should stay outside workspace-specific folders, such as `ChannelButtons` and `ChannelHeaderLabel`.
* User-facing channel column labels should stay generic (`Channels` and `Channel`) unless a specific workflow needs extra clarity.
* Sample editing surfaces should keep `SampleEditorModal` and `SampleManagerModal` names so one-shot waveform editing and broader sample-library cleanup remain separate workflows.

When kit switching is exposed in the UI, prefer a review/apply flow:

* If every lane maps confidently, the app may apply the mapping directly.
* If mappings are low confidence or unresolved, show a dialog with the proposed mapping.
* The dialog should let the user choose a target channel, mute/ignore an unresolved lane, or accept the fallback.
* User corrections should update assignments, not rewrite notes.

## Development style

Prefer small, focused, incremental changes.

TypeScript migration is in progress. The project has a `tsconfig.json` and `npm run typecheck`; JavaScript remains supported through `allowJs` while component, test, and remaining service files are migrated. Model/state files, factory preset and pattern-pack data, sample config, common barrel exports, and several small service utilities have already been converted.

Before making changes:

1. Inspect the current repo structure.
2. Identify the relevant state/model files.
3. Identify where kit preset selection, pattern loading, and default model creation currently happen.
4. Summarize the coupling before changing it.
5. Propose the smallest safe refactor.

When editing:

* Keep diffs focused.
* Keep the app building after each step.
* Prefer clear names over clever abstractions.
* Do not perform large unrelated formatting changes.
* Do not rewrite broad areas unless the task specifically calls for it.
* Preserve working audio behavior when possible.
* Run the normal build/test command after changes when practical.

## Known audio context

The app previously had problems where manual sample triggering worked but sequencer playback did not produce sound. That issue has been fixed in the current working state. Avoid refactors that disturb the working playback path unless necessary.

Humanize is part of the working playback path. The current maximum setting uses a 20ms timing standard deviation and a 12% velocity standard deviation, with bounded output and deterministic seeded randomness per note occurrence.

Impulse response assets may exist in the project. We may eventually want to use these to expand the reverb options.

## Suggested Codex tasks

A useful follow-up analysis task is:

```text
Inspect the edited-sample save flow and propose replace-existing behavior for user samples without risking factory sample mutation.
```

A useful follow-up editing task is:

```text
Add a replace-existing option when editing an existing user sample. Keep factory samples save-copy only.
```

## Current priorities

Near-term priorities:

1. Build a first kit-switching flow that calls the resolver and applies high-confidence mappings.
2. Add a review dialog for low-confidence or unresolved kit-channel mappings.
3. Build out kit management UI: create, select, rename, delete, duplicate.
4. Consider replace-existing behavior for edited user samples, while keeping factory samples save-copy only.
5. Consider adjustable trim fade length/de-click options if manual trimming needs more control.
6. Keep Pattern and Song workspaces focused on their own responsibilities.

## Non-goals for now

The following are not priorities unless specifically requested:

* Backwards compatibility with old saved app data.
* Large visual redesign unrelated to the workspace refactor.
* Major package upgrades unrelated to the current feature work.
* Replacing the audio engine from scratch.
* Adding server-side persistence.

## General instruction for Codex

When continuing this project, first use the repo contents as the source of truth. These notes describe the intended direction, but the current code may have changed. If the notes conflict with the current code, explain the conflict and recommend a small next step rather than guessing. Please continue to suggest modifications to this file to keep it updated as we discuss new ideas and directions.
