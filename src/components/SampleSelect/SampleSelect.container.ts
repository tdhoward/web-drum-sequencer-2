import { connect } from 'react-redux';
import { SampleSelectComponent } from './SampleSelect.component';
import { saveRecordedUserSample, saveUserSample, loadAndSetChannelSample } from '../../common';
import { sampleSelectSelectors } from './SampleSelect.selectors';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type SampleSelectChannel = {
  id: string;
  name?: string;
  sample?: string;
  sampleLoaded?: boolean;
};

type SampleSelectOwnProps = {
  channel: SampleSelectChannel;
  showLabel?: boolean;
};

type SampleSelectDispatchProps = {
  loadAndSetChannelSample: (channelId: string, sampleUrl: string) => void;
  saveRecordedUserSample: (
    channelId: string,
    audioBuffer: AudioBuffer,
    sampleName: string,
  ) => Promise<void>;
  saveUserSample: (channelId: string, files: FileList | File[]) => void;
};

type SampleSelectOption = {
  value: string;
};

type FileInputChangeEvent = {
  target: {
    files: FileList | null;
  };
};

const mapStateToProps = (state: RootState) => {
  const stateProps = sampleSelectSelectors(state);

  return {
    ...stateProps,
    userSamples: stateProps.userSamples || [],
  };
};

type SampleSelectStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): SampleSelectDispatchProps => ({
  loadAndSetChannelSample: (channelId, sampleUrl) => {
    dispatch(loadAndSetChannelSample(channelId, sampleUrl) as unknown as AppAction);
  },
  saveUserSample: (channelId, files) => {
    dispatch(saveUserSample(channelId, files) as unknown as AppAction);
  },
  saveRecordedUserSample: (channelId, audioBuffer, sampleName) => (
    dispatch(saveRecordedUserSample(
      channelId,
      audioBuffer,
      sampleName,
    ) as unknown as AppAction) as unknown as Promise<void>
  ),
});

const mergeProps = (
  stateProps: SampleSelectStateProps,
  dispatchProps: SampleSelectDispatchProps,
  ownProps: SampleSelectOwnProps,
) => ({
  ...stateProps,
  ...ownProps,
  onSelectSample: (sample: SampleSelectOption) => {
    dispatchProps.loadAndSetChannelSample(ownProps.channel.id, sample.value);
  },
  onSampleFileChosen: (event: FileInputChangeEvent) => {
    const files = event.target.files;

    if (files) {
      dispatchProps.saveUserSample(ownProps.channel.id, files);
    }
  },
  onSaveRecordedSample: (audioBuffer: AudioBuffer, sampleName: string) => (
    dispatchProps.saveRecordedUserSample(ownProps.channel.id, audioBuffer, sampleName)
  ),
});

export const SampleSelect = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SampleSelectComponent);
