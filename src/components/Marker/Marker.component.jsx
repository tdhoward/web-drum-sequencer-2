import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box } from '../design-system';
import { getCurrentBeat } from '../../services/audioContext';

const Container = styled(Box)`
  overflow: hidden;
`;

const MarkerBar = styled.div`
  background-color: ${({ theme }) => theme.colors.channelHeaderMarkerBackground};
  height: 100%;
  position: absolute;
  width: 0;
`;

export class MarkerComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.animationFrame = null;
    this.marker = null;
    this.updateMarker = this.updateMarker.bind(this);
  }

  componentDidMount() {
    this.updateMarker();
  }

  componentWillUnmount() {
    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
    }
    this.animationFrame = null;
    this.marker = null;
  }

  updateMarker() {
    const { playing, startTime, bpm } = this.props;
    if (playing && this.marker) {
      const currentBeat = getCurrentBeat(bpm, startTime);
      const progress = (currentBeat - 1) / 4 * 100;
      this.marker.style.width = `${progress}%`;
    }
    this.animationFrame = window.requestAnimationFrame(this.updateMarker);
  }

  render() {
    const { children } = this.props;
    return (
      <Container flex="1 1 auto" position="relative">
        <MarkerBar
          ref={(ref) => { this.marker = ref; }}
        />
        <Box position="absolute" display="flex" width="100%">
          {children}
        </Box>
      </Container>
    );
  }
}

MarkerComponent.defaultProps = {
  startTime: null,
};

MarkerComponent.propTypes = {
  startTime: PropTypes.number,
  bpm: PropTypes.number.isRequired,
  playing: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};
