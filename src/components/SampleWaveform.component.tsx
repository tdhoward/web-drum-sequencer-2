import React, { useEffect, useRef, useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { classicDarkTheme } from '../styles/theme';
import { loadSampleBuffer } from '../services/sampleStore';

type WaveformPeak = {
  min: number;
  max: number;
};

type WaveformTracePoint = {
  value: number;
  x: number;
};

type SampleWaveformProps = {
  alignmentOffset?: number;
  onAlignmentChange?: (alignmentOffset: number) => void;
  sampleContentHash?: string;
  sampleUrl?: string;
  onClick?: () => void;
  title?: string;
};

type CanvasSize = {
  width: number;
  height: number;
};

const MAX_OSCILLOSCOPE_SAMPLE_COUNT = 12000;
const MAX_OSCILLOSCOPE_SAMPLES_PER_PIXEL = 4;

const waveformFrameStyles = css`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  height: 2.5rem;
  min-width: 0;
  position: relative;
  width: 100%;
`;

const WaveformFrame = styled.div<{ $isAligning: boolean }>`
  ${waveformFrameStyles}
  height: ${({ $isAligning }) => ($isAligning ? '5.15rem' : '2.5rem')};
  transition: height 0.12s ease;
`;

const WaveformSurface = styled.button`
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  height: 2.5rem;
  left: 0;
  padding: 0;
  position: absolute;
  text-align: left;
  top: 0;
  touch-action: none;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderHover};
    outline-offset: -2px;
  }
`;

const WaveformCanvas = styled.canvas`
  display: block;
  height: 100%;
  width: 100%;
`;

const DurationLabel = styled.span`
  background: ${({ theme }) => theme.colors.waveformDurationBackground};
  border: 1px solid ${({ theme }) => theme.colors.waveformDurationBorder};
  border-radius: 0.2rem;
  bottom: 0.15rem;
  color: ${({ theme }) => theme.colors.waveformDurationText};
  font-size: 0.65rem;
  line-height: 1;
  padding: 0.15rem 0.25rem;
  pointer-events: none;
  position: absolute;
  right: 0.2rem;
`;

const AlignmentGuide = styled.span<{ $position: number }>`
  background: ${({ theme }) => theme.colors.accentPrimary};
  bottom: 0;
  left: ${({ $position }) => `${$position}%`};
  opacity: 0.3;
  pointer-events: none;
  position: absolute;
  top: 0.45rem;
  transform: translateX(-0.5px);
  width: 1px;
`;

const AlignmentMarker = styled.span<{ $position: number }>`
  background: ${({ theme }) => theme.colors.accentPrimary};
  clip-path: polygon(0 0, 100% 0, 0 100%);
  height: 0.48rem;
  left: ${({ $position }) => `${$position}%`};
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 0.24rem;
`;

const AlignmentModeLabel = styled.span`
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid ${({ theme }) => theme.colors.waveformDurationBorder};
  border-radius: 0.2rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.61rem;
  line-height: 1;
  opacity: 0.78;
  padding: 0.13rem 0.24rem;
  pointer-events: none;
`;

const AlignmentModeButton = styled.button`
  align-items: flex-start;
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: flex;
  font: inherit;
  height: 2.5rem;
  justify-content: flex-end;
  min-width: 3.5rem;
  padding: 0.15rem 0.2rem;
  position: absolute;
  right: 0;
  top: 0;
  touch-action: manipulation;
  z-index: 3;

  &:focus-visible {
    outline: 0;
  }

  &:focus-visible ${AlignmentModeLabel} {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }
`;

const AlignmentControls = styled.div`
  align-items: center;
  bottom: 0.2rem;
  display: flex;
  gap: 0.25rem;
  left: 0.25rem;
  position: absolute;
  right: 0.25rem;
  top: 2.65rem;
`;

const AlignmentValue = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  flex: 1 1 auto;
  font-size: 0.66rem;
  line-height: 1.1;
  min-width: 4.5rem;
`;

const AlignmentStepButton = styled.button`
  appearance: none;
  background: ${({ theme }) => theme.colors.borderSubtle};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
  height: 2rem;
  padding: 0 0.48rem;
  touch-action: manipulation;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
  }
`;

const getMonoSampleValue = (channels: Float32Array[], sampleIndex: number): number => {
  if (channels.length === 1) {
    return channels[0][sampleIndex];
  }

  let total = 0;
  for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
    total += channels[channelIndex][sampleIndex];
  }
  return total / channels.length;
};

const getAudioChannels = (audioBuffer: AudioBuffer): Float32Array[] => {
  const channels: Float32Array[] = [];

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, channelIndex);
    channels.push(channelData);
  }

  return channels;
};

export const getWaveformPeaks = (audioBuffer: AudioBuffer, width: number): WaveformPeak[] => {
  const pixelCount = Math.max(1, Math.floor(width));
  const samplesPerPixel = audioBuffer.length / pixelCount;
  const channels = getAudioChannels(audioBuffer);
  const peaks: WaveformPeak[] = [];

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const start = Math.floor(pixelIndex * samplesPerPixel);
    const end = Math.min(
      audioBuffer.length,
      Math.max(start + 1, Math.floor((pixelIndex + 1) * samplesPerPixel)),
    );
    let min = 1;
    let max = -1;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const value = getMonoSampleValue(channels, sampleIndex);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }

    if (end - start === 1) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }

    peaks.push({ min, max });
  }

  return peaks;
};

export const getWaveformTracePoints = (
  audioBuffer: AudioBuffer,
  width: number,
): WaveformTracePoint[] => {
  const canvasWidth = Math.max(1, Math.floor(width));
  const channels = getAudioChannels(audioBuffer);

  if (audioBuffer.length === 1) {
    return [{
      value: getMonoSampleValue(channels, 0),
      x: canvasWidth / 2,
    }];
  }

  const maxX = Math.max(1, canvasWidth - 1);
  const points: WaveformTracePoint[] = [];

  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
    points.push({
      value: getMonoSampleValue(channels, sampleIndex),
      x: (sampleIndex / (audioBuffer.length - 1)) * maxX,
    });
  }

  return points;
};

const shouldDrawOscilloscopeTrace = (audioBuffer: AudioBuffer, canvasWidth: number): boolean => (
  audioBuffer.length <= MAX_OSCILLOSCOPE_SAMPLE_COUNT
    && audioBuffer.length <= canvasWidth * MAX_OSCILLOSCOPE_SAMPLES_PER_PIXEL
);

const drawOscilloscopeTrace = (
  context: CanvasRenderingContext2D,
  audioBuffer: AudioBuffer,
  canvasWidth: number,
  centerY: number,
  amplitude: number,
  color: string,
  ratio: number,
): void => {
  const points = getWaveformTracePoints(audioBuffer, canvasWidth);

  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, ratio);
  context.globalAlpha = 0.95;

  if (points.length === 1) {
    const [{ value, x }] = points;
    context.moveTo(x, centerY);
    context.lineTo(x, centerY - (value * amplitude));
  } else {
    points.forEach(({ value, x }, pointIndex) => {
      const y = centerY - (value * amplitude);

      if (pointIndex === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
  }

  context.stroke();
  context.globalAlpha = 1;
};

export const drawWaveform = (
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  color = String(classicDarkTheme.colors.waveform),
  guideColor = String(classicDarkTheme.colors.waveformGuide),
): void => {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const canvasWidth = Math.floor(width * ratio);
  const canvasHeight = Math.floor(height * ratio);
  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = guideColor;
  context.fillRect(0, Math.floor(canvasHeight / 2), canvasWidth, 1);
  const centerY = canvasHeight / 2;
  const amplitude = canvasHeight * 0.42;

  if (shouldDrawOscilloscopeTrace(audioBuffer, canvasWidth)) {
    drawOscilloscopeTrace(
      context,
      audioBuffer,
      canvasWidth,
      centerY,
      amplitude,
      color,
      ratio,
    );
    return;
  }

  const peaks = getWaveformPeaks(audioBuffer, canvasWidth);

  context.beginPath();
  peaks.forEach(({ max }, pixelIndex) => {
    const x = pixelIndex + 0.5;
    const top = centerY - (max * amplitude);

    if (pixelIndex === 0) {
      context.moveTo(x, top);
    } else {
      context.lineTo(x, top);
    }
  });

  for (let pixelIndex = peaks.length - 1; pixelIndex >= 0; pixelIndex -= 1) {
    const { min } = peaks[pixelIndex];
    const x = pixelIndex + 0.5;
    const bottom = centerY - (min * amplitude);
    context.lineTo(x, bottom);
  }

  context.closePath();
  context.fillStyle = color;
  context.globalAlpha = 0.78;
  context.fill();

  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, ratio);
  context.globalAlpha = 0.95;
  peaks.forEach(({ min, max }, pixelIndex) => {
    const x = pixelIndex + 0.5;
    const top = centerY - (max * amplitude);
    const bottom = centerY - (min * amplitude);
    context.moveTo(x, top);
    context.lineTo(x, bottom);
  });
  context.stroke();
  context.globalAlpha = 1;
};

const formatDuration = (duration: number): string => `${duration.toFixed(2)} s`;

export const clampAlignmentOffset = (offset: number, duration: number): number => (
  Number.isFinite(offset) && Number.isFinite(duration)
    ? Math.min(Math.max(0, offset), Math.max(0, duration))
    : 0
);

export const alignmentOffsetFromPointer = (
  clientX: number,
  left: number,
  width: number,
  duration: number,
): number => clampAlignmentOffset(((clientX - left) / Math.max(1, width)) * duration, duration);

export const formatAlignmentOffset = (offset: number): string => (
  offset <= 0.0005 ? 'On sample start' : `Start ${Math.round(offset * 1000)} ms early`
);

export const SampleWaveform = ({
  alignmentOffset = 0,
  onAlignmentChange,
  sampleContentHash,
  sampleUrl,
  onClick,
  title,
}: SampleWaveformProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [isAligning, setIsAligning] = useState(false);
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setAudioBuffer(null);

    if (!sampleUrl) {
      return undefined;
    }

    loadSampleBuffer(sampleUrl)
      .then((buffer) => {
        if (!isCancelled) {
          setAudioBuffer(buffer);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAudioBuffer(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sampleContentHash, sampleUrl]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }

    const updateSize = () => {
      const rect = frame.getBoundingClientRect();
      const nextSize = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      };

      setCanvasSize(previousSize => (
        previousSize.width === nextSize.width && previousSize.height === nextSize.height
          ? previousSize
          : nextSize
      ));
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(frame);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (audioBuffer && canvasSize.width > 0 && canvasSize.height > 0) {
      drawWaveform(
        canvas,
        audioBuffer,
        String(theme.colors.waveform),
        String(theme.colors.waveformGuide),
      );
    }
  }, [audioBuffer, canvasSize.width, canvasSize.height, theme]);

  useEffect(() => {
    if (audioBuffer && onAlignmentChange) {
      const clampedOffset = clampAlignmentOffset(alignmentOffset, audioBuffer.duration);
      if (clampedOffset !== alignmentOffset) onAlignmentChange(clampedOffset);
    }
  }, [alignmentOffset, audioBuffer, onAlignmentChange]);

  const duration = audioBuffer?.duration || 0;
  const safeAlignmentOffset = clampAlignmentOffset(alignmentOffset, duration);
  const markerPosition = duration > 0 ? (safeAlignmentOffset / duration) * 100 : 0;
  const updateAlignmentFromPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isAligning || !audioBuffer || !onAlignmentChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onAlignmentChange(alignmentOffsetFromPointer(
      event.clientX,
      rect.left,
      rect.width,
      audioBuffer.duration,
    ));
  };
  const setOffset = (offset: number) => {
    if (audioBuffer && onAlignmentChange) {
      onAlignmentChange(clampAlignmentOffset(offset, audioBuffer.duration));
    }
  };

  return (
    <WaveformFrame
      ref={(element) => { frameRef.current = element; }}
      $isAligning={isAligning}
      title={title}
    >
      <WaveformSurface
        aria-label={isAligning ? 'Set sample beat alignment' : 'Edit sample waveform'}
        onClick={() => { if (!isAligning) onClick?.(); }}
        onPointerDown={(event) => {
          if (!isAligning) return;
          activePointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          updateAlignmentFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (activePointerId.current === event.pointerId) updateAlignmentFromPointer(event);
        }}
        onPointerUp={(event) => {
          if (activePointerId.current === event.pointerId) activePointerId.current = null;
        }}
        onPointerCancel={() => { activePointerId.current = null; }}
        type="button"
      >
        <WaveformCanvas ref={canvasRef} aria-label="Sample waveform" />
        {audioBuffer && <DurationLabel>{formatDuration(audioBuffer.duration)}</DurationLabel>}
        {audioBuffer && <AlignmentGuide $position={markerPosition} />}
        {audioBuffer && <AlignmentMarker $position={markerPosition} />}
      </WaveformSurface>
      {audioBuffer && onAlignmentChange && (
        <AlignmentModeButton
          aria-pressed={isAligning}
          onClick={() => setIsAligning(value => !value)}
          type="button"
        >
          <AlignmentModeLabel>{isAligning ? 'Done' : 'Align'}</AlignmentModeLabel>
        </AlignmentModeButton>
      )}
      {isAligning && (
        <AlignmentControls aria-label="Beat alignment controls">
          <AlignmentValue aria-live="polite">
            {formatAlignmentOffset(safeAlignmentOffset)}
          </AlignmentValue>
          <AlignmentStepButton onClick={() => setOffset(0)} type="button">Reset</AlignmentStepButton>
          <AlignmentStepButton onClick={() => setOffset(safeAlignmentOffset - 0.01)} type="button">
            -10 ms
          </AlignmentStepButton>
          <AlignmentStepButton onClick={() => setOffset(safeAlignmentOffset + 0.01)} type="button">
            +10 ms
          </AlignmentStepButton>
        </AlignmentControls>
      )}
    </WaveformFrame>
  );
};
