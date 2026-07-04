import { connect } from 'react-redux';
import { selectedWorkspaceSelector } from '../../common/workspace';
import { WorkspacePanelComponent } from './WorkspacePanel.component';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

export const WorkspacePanel = connect(mapStateToProps)(WorkspacePanelComponent);
