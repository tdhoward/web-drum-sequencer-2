import {
  doSavePatternPack,
  doSavePatternPackAs,
  loadPatternPack,
  requestPatternPackLoad,
} from './patternPacks.actions';
import {
  DEFAULT_KIT_ID,
  DEFAULT_PATTERN_SETTINGS,
  normalizeKitChannelsState,
  normalizeNotesState,
} from '../sequencerModel';
import type { PatternPack, PatternsState } from '../sequencerModel';
import { PERCUSSION_TYPES } from '../percussion';

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

const createPatternsState = (laneIds: string[]): PatternsState => ({
  ids: ['pattern-0', 'pattern-1'],
  entities: {
    'pattern-0': {
      id: 'pattern-0',
      name: 'Pattern 1',
      ...DEFAULT_PATTERN_SETTINGS,
      laneIds,
    },
    'pattern-1': {
      id: 'pattern-1',
      name: 'Pattern 2',
      ...DEFAULT_PATTERN_SETTINGS,
      timeSignature: {
        beatsPerBar: 6,
        beatUnit: 8,
      },
      stepsPerBeat: 2,
      laneIds,
    },
  },
});

const createSaveState = (userPatternPacks: PatternPack[] = []) => {
  const patterns = createPatternsState(['kick']);

  return {
    song: {
      id: 'song-1',
      name: 'Test Song',
      selectedKitId: DEFAULT_KIT_ID,
      selectedPatternId: 'pattern-0',
      patternIds: ['pattern-0', 'pattern-1'],
    },
    patternPacks: {
      selectedPatternPackId: userPatternPacks[0]?.id || 'hip-hop-swing',
      userPatternPacks,
    },
    tempo: {
      bpm: 112,
      swing: 0.25,
      humanize: 0,
    },
    patterns,
    notes: normalizeNotesState({
      kick: [
        [
          {
            beat: 1,
            id: 'note-1',
          },
        ],
        [],
      ],
    }, patterns.ids, patterns),
    kits: {
      ids: [DEFAULT_KIT_ID],
      entities: {
        [DEFAULT_KIT_ID]: {
          id: DEFAULT_KIT_ID,
          name: 'Default Kit',
          channelIds: ['kit-kick'],
        },
      },
    },
    kitChannels: normalizeKitChannelsState([
      {
        id: 'kit-kick',
        laneId: 'kick',
        name: 'Kick',
        sample: 'kick.wav',
        percussionType: PERCUSSION_TYPES.BASS_DRUM,
      },
    ]),
    kitChannelAssignments: {
      ids: ['kit-kick'],
      entities: {
        'kit-kick': {
          id: 'kit-kick',
          kitId: DEFAULT_KIT_ID,
          laneId: 'kick',
          kitChannelId: 'kit-kick',
          confidence: 'manual',
        },
      },
    },
    samples: {
      ids: [],
      entities: {},
    },
  };
};

describe('loadPatternPack', () => {
  test('defers a low-confidence pattern pack mapping without replacing pattern data', () => {
    const patternPack: PatternPack = {
      id: 'rim-patterns',
      name: 'Rim Patterns',
      bpm: 110,
      swing: 0,
      lanes: [{
        id: 'rim-lane',
        laneId: 'rim-lane',
        percussionType: PERCUSSION_TYPES.RIMSHOT,
      }],
      notes: {},
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
            name: 'Snare Kit',
            channelIds: ['snare-channel'],
          },
        },
      },
      kitChannels: normalizeKitChannelsState([{
        id: 'snare-channel',
        sample: 'snare.wav',
        percussionType: PERCUSSION_TYPES.SNARE_DRUM,
      }]),
    };
    const actions: DispatchedAction[] = [];

    const result = requestPatternPackLoad(patternPack)(
      action => actions.push(action as DispatchedAction),
      () => state,
    );

    expect(result.mappings[0].confidence).toBe('low');
    expect(actions.map(action => action.type)).toEqual(['mappingReview/openMappingReview']);
    expect(actions[0].payload).toEqual(expect.objectContaining({
      operation: expect.objectContaining({ type: 'patternPack', patternPack }),
    }));
  });

  test('loads pattern content and resolves it onto the selected kit', () => {
    const patternPack: PatternPack = {
      id: 'hip-hop-swing',
      name: 'Hip Hop Swing',
      bpm: 98,
      swing: 0.4,
      patternNames: ['Intro'],
      patternSettings: [
        {
          timeSignature: {
            beatsPerBar: 6,
            beatUnit: 8,
          },
          bars: 1,
          stepsPerBeat: 2,
        },
      ],
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
      'playbackSession/stopPlayback',
      'tempo/setBPM',
      'tempo/setSwing',
      'patterns/replacePatternLanes',
      'patterns/replacePatternNames',
      'patterns/replacePatternSettings',
      'notes/setNotes',
      'kitChannelAssignments/replaceKitChannelAssignments',
      'song/setPattern',
      'master/setSelectedChannel',
      'patternPacks/setSelectedPatternPack',
      'song/setSongPatternPackId',
    ]);
    expect(actions[3].payload).toEqual(['hiphop-bd-2']);
    expect(actions[4].payload).toEqual(['Intro']);
    expect(actions[5].payload).toEqual(expect.arrayContaining([
      expect.objectContaining({
        timeSignature: {
          beatsPerBar: 6,
          beatUnit: 8,
        },
        stepsPerBeat: 2,
      }),
    ]));
    const notesPayload = actions[6].payload as { patterns: PatternsState };
    expect(notesPayload.patterns.entities['pattern-0'].stepsPerBeat).toBe(2);
    const assignmentPayload = actions[7].payload as { assignments: unknown[] };
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

describe('doSavePatternPackAs', () => {
  test('saves the current pattern state as a user pattern pack', async () => {
    const state = createSaveState();
    const actions: DispatchedAction[] = [];

    await doSavePatternPackAs('My Patterns')(
      (action) => {
        actions.push(action as DispatchedAction);
      },
      () => state,
    );

    expect(actions.map(action => action.type)).toEqual([
      'patternPacks/savePatternPackAs',
      'patternPacks/setSelectedPatternPack',
      'window/showFlashMessage',
    ]);
    expect(actions[0].payload).toEqual(expect.objectContaining({
      id: 'user-my-patterns',
      name: 'My Patterns',
      bpm: 112,
      swing: 0.25,
      patternNames: ['Pattern 1', 'Pattern 2'],
      patternSettings: expect.arrayContaining([
        DEFAULT_PATTERN_SETTINGS,
        {
          timeSignature: {
            beatsPerBar: 6,
            beatUnit: 8,
          },
          bars: 1,
          stepsPerBeat: 2,
        },
      ]),
      lanes: [
        expect.objectContaining({
          id: 'kick',
          laneId: 'kick',
          name: 'Kick',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
        }),
      ],
    }));
    expect((actions[0].payload as PatternPack).notes.kick[0]).toEqual([
      expect.objectContaining({
        beat: 1,
        id: 'note-1',
      }),
    ]);
    expect(actions[1].payload).toBe('user-my-patterns');
    expect(actions[2].payload).toBe('PATTERN_PACK_SAVED');
  });
});

describe('doSavePatternPack', () => {
  test('updates the selected user pattern pack', async () => {
    const userPatternPack: PatternPack = {
      id: 'user-my-patterns',
      name: 'My Patterns',
      bpm: 90,
      swing: 0,
      lanes: [
        {
          id: 'kick',
          laneId: 'kick',
          name: 'Kick',
        },
      ],
      notes: {
        kick: [[], []],
      },
    };
    const state = createSaveState([userPatternPack]);
    const actions: DispatchedAction[] = [];

    await doSavePatternPack(userPatternPack.id)(
      (action) => {
        actions.push(action as DispatchedAction);
      },
      () => state,
    );

    expect(actions.map(action => action.type)).toEqual([
      'patternPacks/savePatternPack',
      'patternPacks/setSelectedPatternPack',
      'window/showFlashMessage',
    ]);
    expect(actions[0].payload).toEqual(expect.objectContaining({
      id: userPatternPack.id,
      name: userPatternPack.name,
      bpm: 112,
    }));
  });
});
