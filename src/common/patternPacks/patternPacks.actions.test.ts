import { loadPatternPack } from './patternPacks.actions';
import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import type { PatternPack } from '../sequencerModel';
import { PERCUSSION_TYPES } from '../percussion';

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

describe('loadPatternPack', () => {
  test('loads pattern content and resolves it onto the selected kit', () => {
    const patternPack: PatternPack = {
      id: 'hip-hop-swing',
      name: 'Hip Hop Swing',
      bpm: 98,
      swing: 0.4,
      lanes: [
        {
          id: 'hiphop-bd-2',
          laneId: 'hiphop-bd-2',
          name: 'Bass Drum 2',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
          register: 'low',
        },
      ],
      notes: {
        'hiphop-bd-2': [
          [
            {
              beat: 1,
              id: 'note-1',
            },
          ],
        ],
      },
    };
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
        patternIds: ['pattern-0'],
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Default Kit',
            channelIds: ['tr808-bd-short'],
          },
        },
      },
      kitChannels: normalizeKitChannelsState([
        {
          id: 'tr808-bd-short',
          sample: 'kick.mp3',
          gain: 1,
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
          register: 'low',
        },
      ]),
    };
    const actions: DispatchedAction[] = [];

    const result = loadPatternPack(patternPack)(
      (action) => {
        actions.push(action as DispatchedAction);
      },
      () => state,
    );

    expect(result.unresolved).toEqual([]);
    expect(actions.map(action => action.type)).toEqual([
      'tempo/setBPM',
      'tempo/setSwing',
      'patterns/replacePatternLanes',
      'notes/setNotes',
      'kitChannelAssignments/replaceKitChannelAssignments',
      'song/setPattern',
      'master/setSelectedChannel',
      'patternPacks/setSelectedPatternPack',
    ]);
    expect(actions[2].payload).toEqual(['hiphop-bd-2']);
    const assignmentPayload = actions[4].payload as { assignments: unknown[] };
    expect(assignmentPayload.assignments).toEqual([
      expect.objectContaining({
        id: 'tr808-bd-short',
        laneId: 'hiphop-bd-2',
        kitChannelId: 'tr808-bd-short',
        confidence: 'high',
      }),
    ]);
  });
});
