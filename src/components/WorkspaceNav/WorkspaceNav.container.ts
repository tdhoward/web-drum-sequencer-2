import { connect } from 'react-redux';
import { WorkspaceNavComponent } from './WorkspaceNav.component';
import {
  selectedWorkspaceSelector,
  setSelectedWorkspace,
} from '../../common/workspace';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

const mapDispatchToProps = {
  setSelectedWorkspace,
};

export const WorkspaceNav = connect(
  mapStateToProps,
  mapDispatchToProps,
)(WorkspaceNavComponent);
