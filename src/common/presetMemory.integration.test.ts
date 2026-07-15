import rootReducer from '../reducer';
import { setChannelGain } from './channels';
import { isCurrentPatternPackEditedSelector } from './patternPacks';
import { setBPM } from './tempo';
import { presetSelectorSelectors } from '../components/PresetSelector/PresetSelector.selectors';

describe('preset modification tracking', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });

  it('does not mark the default kit as edited on initialization', () => {
    expect(presetSelectorSelectors(initialState).isEdited).toBe(false);
  });

  it('does not mark the default pattern pack as edited on initialization', () => {
    expect(isCurrentPatternPackEditedSelector(initialState)).toBe(false);
  });

  it('marks a kit as edited after a channel change', () => {
    const channelId = initialState.kitChannels.ids[0];
    const changedState = rootReducer(initialState, setChannelGain(channelId, 0.5));

    expect(presetSelectorSelectors(changedState).isEdited).toBe(true);
  });

  it('marks a pattern pack as edited after a tempo change', () => {
    const changedState = rootReducer(initialState, setBPM(initialState.tempo.bpm + 1));

    expect(isCurrentPatternPackEditedSelector(changedState)).toBe(true);
  });
});
