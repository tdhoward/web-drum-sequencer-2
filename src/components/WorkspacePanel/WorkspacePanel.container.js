import { connect } from 'react-redux';
import { selectedWorkspaceSelector } from '../../common/workspace';
import { WorkspacePanelComponent } from './WorkspacePanel.component';

const mapStateToProps = state => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

export const WorkspacePanel = connect(mapStateToProps)(WorkspacePanelComponent);
