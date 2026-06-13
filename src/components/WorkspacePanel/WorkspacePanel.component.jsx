import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '../design-system';
import { WORKSPACES } from '../../common/workspace';

const placeholderCopy = {
  [WORKSPACES.KIT]: {
    title: 'Kit workspace',
    body: 'Kit selection and kit channel editing will go here.',
  },
  [WORKSPACES.SONG]: {
    title: 'Song workspace',
    body: 'Song and arrangement editing will go here.',
  },
};

export const WorkspacePanelComponent = ({ selectedWorkspace }) => {
  const copy = placeholderCopy[selectedWorkspace];

  if (!copy) {
    return null;
  }

  return (
    <Box
      bg="darkGray"
      border="1px solid"
      borderColor="steel"
      borderRadius="0.5rem"
      mt={3}
      p={[3, 3, 4]}
    >
      <Text color="nearWhite" fontSize={3} fontWeight="bold" lineHeight="1.2em" mb={2}>
        {copy.title}
      </Text>
      <Text color="lightGray" fontSize={2} lineHeight="1.5em">
        {copy.body}
      </Text>
    </Box>
  );
};

WorkspacePanelComponent.propTypes = {
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
};
