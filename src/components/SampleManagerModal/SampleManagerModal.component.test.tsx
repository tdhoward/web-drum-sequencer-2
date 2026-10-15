/** @jest-environment jsdom */

import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import rootReducer from '../../reducer';
import { deletePreset } from '../../common/presets';
import { createKitsState, normalizeKitChannelsState } from '../../common/sequencerModel';
import { deleteSampleBuffer } from '../../services/sampleStore';
import { classicDarkTheme } from '../../styles/theme';
import { SampleManagerModal } from './SampleManagerModal.container';

jest.mock('../../services/audioRouter', () => ({
  playNote: jest.fn(),
  stopAllNotes: jest.fn(),
}));

jest.mock('../../services/sampleStore', () => ({
  deleteSampleBuffer: jest.fn(),
  loadSampleBuffer: jest.fn(),
}));

const activeChannels = [{ id: 'snare', name: 'Active Snare', sample: 'active.wav' }];

const renderManager = () => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      kits: createKitsState(activeChannels),
      kitChannels: normalizeKitChannelsState(activeChannels),
      presets: {
        preset: 'Active Kit',
        userPresets: [{
          name: 'Studio Kit',
          channels: [{
            id: 'snare',
            name: 'Studio Snare',
            velocityLayers: [
              { sample: 'main.wav', maxVelocity: 100 },
              { sampleId: 'sample:protected.wav', maxVelocity: 127 },
            ],
          }],
        }],
      },
      userSamples: [
        { id: 'protected.wav', name: 'Saved Sample' },
        { id: 'active.wav', name: 'Active Sample' },
        { id: 'unused.wav', name: 'Unused Sample' },
      ],
    },
  });
  render(
    <Provider store={store}>
      <ThemeProvider theme={classicDarkTheme}>
        <SampleManagerModal onClose={jest.fn()} show />
      </ThemeProvider>
    </Provider>,
  );
  return store;
};

const getSampleRow = (sampleName: string) => within(
  screen.getByRole('textbox', { name: `Name for ${sampleName}` }).parentElement!,
);

describe('sample manager saved Kit protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.mocked(deleteSampleBuffer).mockImplementation(sampleId => Promise.resolve(sampleId));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('identifies saved Kit layer usage and disables deletion for active and saved references', () => {
    renderManager();
    const savedSample = getSampleRow('Saved Sample');
    const activeSample = getSampleRow('Active Sample');
    const unusedSample = getSampleRow('Unused Sample');

    expect(savedSample.getByText(
      'Used by Saved Kit "Studio Kit" · Studio Snare · Layer 2 · 101-127',
    )).toBeTruthy();
    expect(activeSample.getByText('Used by Active Snare · 1-127')).toBeTruthy();
    expect((savedSample.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect((activeSample.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect((unusedSample.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled)
      .toBe(false);

    fireEvent.click(savedSample.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).not.toHaveBeenCalled();
    expect(deleteSampleBuffer).not.toHaveBeenCalled();
  });

  test('allows deleting the sample after its last saved Kit reference is removed', async () => {
    const store = renderManager();

    act(() => {
      store.dispatch(deletePreset('Studio Kit'));
    });

    const savedSample = getSampleRow('Saved Sample');
    expect(savedSample.getByText('Unused')).toBeTruthy();
    const deleteButton = savedSample.getByRole('button', { name: 'Delete' }) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(false);

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Name for Saved Sample' })).toBeNull();
    });
    expect(window.confirm).toHaveBeenCalledWith('Delete sample "Saved Sample"?');
    expect(deleteSampleBuffer).toHaveBeenCalledWith('protected.wav');
  });
});
