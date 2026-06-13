import { connect } from 'react-redux';
import { WorkspaceNavComponent } from './WorkspaceNav.component';
import {
  selectedWorkspaceSelector,
  setSelectedWorkspace,
} from '../../common/workspace';

const mapStateToProps = state => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

const mapDispatchToProps = {
  setSelectedWorkspace,
};

export const WorkspaceNav = connect(
  mapStateToProps,
  mapDispatchToProps,
)(WorkspaceNavComponent);
