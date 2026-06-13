import * as R from 'ramda';
import { WORKSPACES } from './workspace.reducer';

export const selectedWorkspaceSelector = R.pathOr(
  WORKSPACES.PATTERN,
  ['workspace', 'selectedWorkspace'],
);
