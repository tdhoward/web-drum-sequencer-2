import React from 'react';
import { PatternPackSelector } from '../PatternPackSelector';
import { PatternNameInput } from '../PatternNameInput';
import { PatternSelector } from '../PatternSelector';
import { TimeSignatureSelector } from '../TimeSignatureSelector';
import { WorkspaceControls } from '../WorkspaceControls';

export const PatternWorkspaceControls = () => (
  <WorkspaceControls>
    <PatternPackSelector />
    <PatternSelector />
    <TimeSignatureSelector />
    <PatternNameInput />
  </WorkspaceControls>
);
