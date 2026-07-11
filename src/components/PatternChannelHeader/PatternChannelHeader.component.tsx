import React from 'react';
import { Box } from '../design-system';
import { ChannelHeaderLabel } from '../ChannelHeaderLabel.component';
import { Marker } from '../Marker';

type PatternChannelHeaderComponentProps = {
  beatsPerBar: number;
};

export const PatternChannelHeaderComponent = ({
  beatsPerBar,
}: PatternChannelHeaderComponentProps) => {
  const beatLabels = Array.from(
    { length: Math.max(1, Math.round(beatsPerBar)) },
    (_, index) => index + 1,
  );

  return (
    <Box bg="channelHeaderBackground" display="flex" mt={3}>
      <Box width="16rem" display="flex" mr={[2, 2, 2, 3, 4]}>
        <ChannelHeaderLabel flex="1 1 auto" mr={[2]}>
          Channels
        </ChannelHeaderLabel>
        <ChannelHeaderLabel width={30} mr={2} centerText>
          Hit
        </ChannelHeaderLabel>
      </Box>
      <Marker>
        {beatLabels.map(beatLabel => (
          <ChannelHeaderLabel key={beatLabel} flex="1 1 auto">
            {beatLabel}
          </ChannelHeaderLabel>
        ))}
      </Marker>
    </Box>
  );
};
