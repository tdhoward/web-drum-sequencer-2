import { replaceKitChannels } from '../channels';
import { kitsInitialState, kitsReducer } from './kits.reducer';

jest.mock('../../presets');
jest.mock('../../samples.config');

describe('replaceKitChannels', () => {
  test('updates the selected kit channelIds when kit channels are replaced', () => {
    const state = kitsReducer(
      kitsInitialState,
      replaceKitChannels([
        {
          id: 'new-kit-channel',
          sample: 'new.wav',
          gain: 1,
        },
      ]),
    );
    const kitId = kitsInitialState.ids[0];

    expect(state.entities[kitId].channelIds).toEqual(['new-kit-channel']);
  });
});
