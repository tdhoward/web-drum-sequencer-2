import React from 'react';
import styled from 'styled-components';
import { Box, Text } from '../design-system';

const CurrentKitText = styled(Box)`
  min-height: 2.7rem;
  text-align: center;
`;

type CurrentKitDisplayComponentProps = {
  kitName: string;
};

export const CurrentKitDisplayComponent = ({
  kitName,
}: CurrentKitDisplayComponentProps) => (
  <CurrentKitText
    alignItems="center"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    minWidth="8rem"
    px={1}
  >
    <Text
      color="textMuted"
      fontSize="0.6rem"
      fontWeight="600"
      letterSpacing="0.1em"
      lineHeight="1.1em"
    >
      CURRENT KIT
    </Text>
    <Text color="textPrimary" fontSize={2} fontWeight="600" lineHeight="1.2em" mt={1}>
      {kitName}
    </Text>
  </CurrentKitText>
);
