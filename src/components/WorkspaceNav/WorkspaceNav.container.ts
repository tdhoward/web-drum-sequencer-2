import { connect } from 'react-redux';
import { WorkspaceNavComponent } from './WorkspaceNav.component';
import {
  selectedWorkspaceSelector,
  selectWorkspace,
} from '../../common/workspace';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

const mapDispatchToProps = {
  setSelectedWorkspace: selectWorkspace,
};

export const WorkspaceNav = connect(
  mapStateToProps,
  mapDispatchToProps,
)(WorkspaceNavComponent);
