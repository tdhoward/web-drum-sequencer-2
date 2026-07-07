import { connect } from 'react-redux';
import {
  channelsSelector,
  deleteSavedUserSample,
  renameSavedUserSample,
  userSamplesSelector,
} from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { SampleManagerModalComponent } from './SampleManagerModal.component';

type AppAction = Parameters<AppDispatch>[0];

type SampleManagerModalDispatchProps = {
  onDeleteSample: (sampleId: string) => Promise<void>;
  onRenameSample: (sampleId: string, name: string) => void;
};

const mapStateToProps = (state: RootState) => ({
  channels: channelsSelector(state),
  userSamples: userSamplesSelector(state) || [],
});

const mapDispatchToProps = (dispatch: AppDispatch): SampleManagerModalDispatchProps => ({
  onDeleteSample: sampleId => (
    dispatch(deleteSavedUserSample(sampleId) as unknown as AppAction) as unknown as Promise<void>
  ),
  onRenameSample: (sampleId, name) => {
    dispatch(renameSavedUserSample(sampleId, name) as unknown as AppAction);
  },
});

export const SampleManagerModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleManagerModalComponent);
