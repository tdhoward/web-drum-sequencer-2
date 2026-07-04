import React from 'react';
import { LabelBox } from '../LabelBox';
import { HoverButton } from '../design-system';

type PatternSelectorComponentProps = {
  pattern: number;
  onSelectPattern: (pattern: number) => void;
};

const patternButtonIndexes = Array.from({ length: 8 }, (_, index) => index);

export const PatternSelectorComponent = ({
  onSelectPattern,
  pattern,
}: PatternSelectorComponentProps) => {
  const buttons = patternButtonIndexes.map(buttonNumber => (
    <HoverButton
      key={`preset-${buttonNumber}`}
      p={0}
      height="1.3rem"
      width="1.3rem"
      borderRadius={2}
      bg={pattern === buttonNumber ? 'patternSelectorSelectedBackground' : 'patternSelectorBackground'}
      ml="1px"
      mr="1px"
      mt="1px"
      transitionSpeed="0.1s"
      onClick={() => {
        onSelectPattern(buttonNumber);
      }}
      fontWeight="500"
      fontSize="0.7em"
      color={pattern === buttonNumber ? 'patternSelectorSelectedText' : 'patternSelectorText'}
      activeBg="patternSelectorActiveBackground"
      disabled={pattern === buttonNumber}
      aria-label={`Enable pattern ${buttonNumber}`}
      lineHeight="1.4em"
    >
      {buttonNumber + 1}
    </HoverButton>
  ));

  return (
    <LabelBox label="PATTERNS" hoverEffect>
      {buttons}
    </LabelBox>
  );
};
