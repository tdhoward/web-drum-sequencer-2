import React from 'react';
import styled from 'styled-components';
import { LabelBox } from '../LabelBox';
import { TextInput } from '../design-system';

type PatternNameInputComponentProps = {
  patternName: string;
  onSetPatternName: (name: string) => void;
};

const NameInput = styled(TextInput)`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border-radius: 0.2rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.8rem;
  font-weight: 500;
  height: 1.3rem;
  line-height: 1.2em;
  padding: 0 0.45rem;
  width: 8.5rem;

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.borderHover};
  }
`;

export const PatternNameInputComponent = ({
  patternName,
  onSetPatternName,
}: PatternNameInputComponentProps) => (
  <LabelBox label="NAME" hoverEffect>
    <NameInput
      aria-label="Pattern name"
      maxLength={32}
      value={patternName}
      onChange={(event) => {
        onSetPatternName(event.target.value);
      }}
    />
  </LabelBox>
);
