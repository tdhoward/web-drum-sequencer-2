import React from 'react';
import styled from 'styled-components';
import type { ReactNode } from 'react';
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

export class MarkerComponent extends React.PureComponent<MarkerComponentProps> {
  animationFrame: number | null = null;

  marker: HTMLDivElement | null = null;

  constructor(props: MarkerComponentProps) {
    super(props);
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
    const {
      playing,
      startTime,
      bpm,
      patternLengthInBeats,
    } = this.props;
    if (playing && this.marker) {
      const currentBeat = getCurrentBeat(bpm, startTime ?? 0, undefined, patternLengthInBeats);
      const progress = ((currentBeat - 1) / patternLengthInBeats) * 100;
      const clampedProgress = Math.min(100, Math.max(0, progress));
      this.marker.style.width = `${clampedProgress}%`;
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

type MarkerComponentProps = {
  startTime?: number | null;
  bpm: number;
  patternLengthInBeats: number;
  playing: boolean;
  children: ReactNode;
};
