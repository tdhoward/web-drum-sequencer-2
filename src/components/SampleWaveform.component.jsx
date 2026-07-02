import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled, { useTheme } from 'styled-components';
import { classicDarkTheme } from '../styles/theme';
import { loadSampleBuffer } from '../services/sampleStore';

const WaveformFrame = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  height: 2.5rem;
  min-width: 0;
  overflow: hidden;
  position: relative;
  width: 100%;
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

const getMonoSampleValue = (channels, sampleIndex) => {
  if (channels.length === 1) {
    return channels[0][sampleIndex];
  }

  let total = 0;
  for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
    total += channels[channelIndex][sampleIndex];
  }
  return total / channels.length;
};

export const getWaveformPeaks = (audioBuffer, width) => {
  const pixelCount = Math.max(1, Math.floor(width));
  const samplesPerPixel = audioBuffer.length / pixelCount;
  const channels = [];
  const peaks = [];

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    channels.push(audioBuffer.getChannelData(channelIndex));
  }

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

    peaks.push({ min, max });
  }

  return peaks;
};

export const drawWaveform = (
  canvas,
  audioBuffer,
  color = classicDarkTheme.colors.waveform,
  guideColor = classicDarkTheme.colors.waveformGuide,
) => {
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
  const peaks = getWaveformPeaks(audioBuffer, canvasWidth);
  const centerY = canvasHeight / 2;
  const amplitude = canvasHeight * 0.42;

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

const formatDuration = duration => `${duration.toFixed(2)} s`;

export const SampleWaveform = ({ sampleUrl }) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

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
  }, [sampleUrl]);

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
      drawWaveform(canvas, audioBuffer, theme.colors.waveform, theme.colors.waveformGuide);
    }
  }, [audioBuffer, canvasSize.width, canvasSize.height, theme]);

  return (
    <WaveformFrame ref={frameRef}>
      <WaveformCanvas ref={canvasRef} aria-label="Sample waveform" />
      {audioBuffer && (
        <DurationLabel>
          {formatDuration(audioBuffer.duration)}
        </DurationLabel>
      )}
    </WaveformFrame>
  );
};

SampleWaveform.propTypes = {
  sampleUrl: PropTypes.string.isRequired,
};
