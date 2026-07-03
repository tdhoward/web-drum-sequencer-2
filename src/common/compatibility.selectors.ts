// Compatibility selectors keep the older UI/audio-facing shapes stable while
// the underlying sequencer model evolves toward songs, kits, lanes, and notes.
// New feature code should prefer the domain selectors from song, patterns,
// kits, kitChannels, samples, and notes when it does not need legacy shapes.
export { channelsSelector as legacyChannelsSelector } from './channels';
export { notesSelector as legacyNotesSelector } from './notes';
export { patternSelector as legacyPatternIndexSelector } from './song';
