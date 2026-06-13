import {
  masterInitialState,
  masterReducer,
  setSelectedChannel,
} from './master.reducer';

describe('setSelectedChannel', () => {
  test('should change the selected channel', () => {
    const state = masterReducer(masterInitialState, setSelectedChannel('channel-2'));
    expect(state.selectedChannel).toEqual('channel-2');
  });
});
