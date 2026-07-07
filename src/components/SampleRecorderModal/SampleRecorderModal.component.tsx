import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { playNote, stopAllNotes } from '../../services/audioRouter';
import { decodeAudio, decodeFile } from '../../services/fileUtils';
import {
  DEFAULT_TRIM_FADE_SECONDS,
  cloneAudioBuffer,
  detectAudibleRange,
  renderEditedSampleBuffer,
} from '../../services/sampleEditing';
import { Modal } from '../Modal.component';

const RECORDER_PREVIEW_CHANNEL_ID = 'sample-recorder-preview';
const MAX_RECORDING_SECONDS = 30;

type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'processing' | 'ready' | 'saving';

type SampleRecorderModalProps = {
  channelName?: string;
  onClose: () => void;
  onSaveRecordedSample: (audioBuffer: AudioBuffer, sampleName: string) => Promise<void> | void;
  show: boolean;
};

type ToggleButtonProps = {
  $active?: boolean;
};

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.4rem;
  box-sizing: border-box;
  box-shadow: 0 1.2rem 2.4rem rgba(0, 0, 0, 0.44);
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: calc(100vh - 2rem);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 1rem;
  width: min(28rem, calc(100vw - 2rem));
`;

const Header = styled.div`
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.nearWhite};
  font-size: 1rem;
  line-height: 1.2;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CloseButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  font-size: 1.4rem;
  height: 2rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 2rem;

  &:hover, &:focus-visible {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const StatusPanel = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  display: flex;
  justify-content: space-between;
  min-height: 4rem;
  padding: 0.75rem;
`;

const StatusText = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
`;

const TimerText = styled.div`
  color: ${({ theme }) => theme.colors.accentPrimary};
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
`;

const NameRow = styled.label`
  align-items: center;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: 4rem minmax(0, 1fr);
  width: 100%;
`;

const NameLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const NameInput = styled.input`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 0.82rem;
  min-width: 0;
  padding: 0.55rem 0.65rem;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.colors.borderHover};
    outline: 0;
  }

  &:disabled {
    opacity: 0.45;
  }
`;

const ControlRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ControlButton = styled.button<ToggleButtonProps>`
  background: ${({ $active, theme }) => (
    $active ? theme.colors.accentPrimary : theme.colors.surfaceControl
  )};
  border: 2px solid ${({ $active, theme }) => (
    $active ? theme.colors.accentPrimary : theme.colors.borderDefault
  )};
  border-radius: 0.25rem;
  color: ${({ $active, theme }) => (
    $active ? theme.colors.surfaceInverse : theme.colors.textPrimary
  )};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  min-height: 2.25rem;
  padding: 0.6rem 0.75rem;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:not(:disabled):hover, &:not(:disabled):focus-visible {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const RecordButton = styled(ControlButton)`
  color: ${({ $active, theme }) => ($active ? theme.colors.surfaceInverse : theme.colors.danger)};
`;

const PrimaryButton = styled(ControlButton)`
  min-width: 4rem;
`;

const TrimLabel = styled.label`
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  font-size: 0.76rem;
  font-weight: 700;
  gap: 0.4rem;
  min-height: 2.25rem;
`;

const TrimCheckbox = styled.input`
  accent-color: ${({ theme }) => theme.colors.accentPrimary};
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.errorBorder};
  font-size: 0.75rem;
  min-height: 1rem;
`;

const getDefaultRecordedSampleName = (channelName = 'Sample'): string => {
  const safeChannelName = channelName.trim() || 'Sample';
  return `${safeChannelName} Recording`;
};

const formatElapsedSeconds = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - (minutes * 60);
  return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
};

const isRecordingSupported = (): boolean => (
  typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'
);

const getRecorderOptions = (): MediaRecorderOptions | undefined => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }

  const mimeType = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ].find(candidateMimeType => MediaRecorder.isTypeSupported(candidateMimeType));

  return mimeType ? { mimeType } : undefined;
};

const stopStream = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach(track => track.stop());
};

const getSaveBuffer = (
  audioBuffer: AudioBuffer,
  autoTrim: boolean,
): AudioBuffer => {
  if (!autoTrim) {
    return cloneAudioBuffer(audioBuffer);
  }

  const range = detectAudibleRange(audioBuffer);

  return renderEditedSampleBuffer(audioBuffer, {
    ...range,
    fadeSeconds: DEFAULT_TRIM_FADE_SECONDS,
  });
};

export const SampleRecorderModal = ({
  channelName,
  onClose,
  onSaveRecordedSample,
  show,
}: SampleRecorderModalProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ignoreStopRef = useRef(false);
  const requestIdRef = useRef(0);
  const elapsedTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBuffer, setRecordedBuffer] = useState<AudioBuffer | null>(null);
  const [sampleName, setSampleName] = useState(getDefaultRecordedSampleName(channelName));
  const [autoTrim, setAutoTrim] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current !== null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const stopRecording = (showProcessing = true) => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === 'recording') {
      if (showProcessing) {
        setStatus('processing');
      }
      recorder.stop();
    }
  };

  const discardRecording = () => {
    ignoreStopRef.current = true;
    stopElapsedTimer();
    stopRecording(false);
    stopStream(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;
  };

  useEffect(() => {
    if (show) {
      requestIdRef.current += 1;
      ignoreStopRef.current = false;
      chunksRef.current = [];
      setStatus('idle');
      setElapsedSeconds(0);
      setRecordedBuffer(null);
      setSampleName(getDefaultRecordedSampleName(channelName));
      setAutoTrim(true);
      setError(null);
      return undefined;
    }

    discardRecording();
    stopAllNotes();
    return undefined;
  }, [show, channelName]);

  useEffect(() => () => {
    requestIdRef.current += 1;
    discardRecording();
    stopAllNotes();
  }, []);

  const startElapsedTimer = () => {
    const startTime = Date.now();
    stopElapsedTimer();
    elapsedTimerRef.current = window.setInterval(() => {
      const nextElapsedSeconds = Math.min(
        MAX_RECORDING_SECONDS,
        (Date.now() - startTime) / 1000,
      );

      setElapsedSeconds(nextElapsedSeconds);

      if (nextElapsedSeconds >= MAX_RECORDING_SECONDS) {
        stopRecording();
      }
    }, 100);
  };

  const handleRecorderStop = (recorder: MediaRecorder) => {
    stopElapsedTimer();
    stopStream(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;

    if (ignoreStopRef.current) {
      return;
    }

    const recordedBlob = new Blob(chunksRef.current, {
      type: recorder.mimeType || 'audio/webm',
    });
    chunksRef.current = [];

    if (recordedBlob.size === 0) {
      setStatus('idle');
      setError('Recording failed');
      return;
    }

    setStatus('processing');
    decodeFile(recordedBlob)
      .then(decodeAudio)
      .then((audioBuffer) => {
        setRecordedBuffer(audioBuffer);
        setStatus('ready');
      })
      .catch(() => {
        setRecordedBuffer(null);
        setStatus('idle');
        setError('Recording failed');
      });
  };

  const startRecording = () => {
    if (!isRecordingSupported()) {
      setError('Recording is not supported in this browser');
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    ignoreStopRef.current = false;
    chunksRef.current = [];
    setError(null);
    setRecordedBuffer(null);
    setElapsedSeconds(0);
    setStatus('requesting');

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (requestId !== requestIdRef.current) {
          stopStream(stream);
          return;
        }

        const recorder = new MediaRecorder(stream, getRecorderOptions());
        streamRef.current = stream;
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          stopElapsedTimer();
          stopStream(streamRef.current);
          streamRef.current = null;
          mediaRecorderRef.current = null;
          setStatus('idle');
          setError('Recording failed');
        };

        recorder.onstop = () => handleRecorderStop(recorder);
        recorder.start();
        setStatus('recording');
        startElapsedTimer();
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setStatus('idle');
          setError('Microphone unavailable');
        }
      });
  };

  const previewRecording = () => {
    if (!recordedBuffer) {
      return;
    }

    stopAllNotes();
    playNote(null, getSaveBuffer(recordedBuffer, autoTrim), RECORDER_PREVIEW_CHANNEL_ID);
  };

  const handleSave = () => {
    const nextSampleName = sampleName.trim();

    if (!recordedBuffer || !nextSampleName || status === 'saving') {
      if (!nextSampleName) {
        setError('Name required');
      }
      return;
    }

    setStatus('saving');
    setError(null);
    Promise.resolve(onSaveRecordedSample(getSaveBuffer(recordedBuffer, autoTrim), nextSampleName))
      .then(() => {
        stopAllNotes();
        onClose();
      })
      .catch(() => {
        setStatus('ready');
        setError('Could not save sample');
      });
  };

  const handleClose = () => {
    requestIdRef.current += 1;
    discardRecording();
    stopAllNotes();
    onClose();
  };

  if (!show) {
    return null;
  }

  const isBusy = status === 'requesting' || status === 'processing' || status === 'saving';
  const isRecording = status === 'recording';
  const isReady = status === 'ready' && Boolean(recordedBuffer);
  const statusText = isRecording
    ? 'Recording'
    : status === 'requesting'
      ? 'Waiting for microphone'
      : status === 'processing'
        ? 'Processing'
        : isReady ? 'Ready' : 'Idle';

  return (
    <Modal show={show}>
      <Dialog aria-label="Record sample" aria-modal="true" role="dialog">
        <Header>
          <Title>Record Sample</Title>
          <CloseButton aria-label="Close sample recorder" onClick={handleClose} type="button">
            x
          </CloseButton>
        </Header>
        <StatusPanel>
          <StatusText>{statusText}</StatusText>
          <TimerText>{formatElapsedSeconds(elapsedSeconds)}</TimerText>
        </StatusPanel>
        <ControlRow>
          <ButtonGroup>
            <RecordButton
              $active={isRecording}
              disabled={isBusy && !isRecording}
              onClick={isRecording ? () => stopRecording() : startRecording}
              type="button"
            >
              {isRecording ? 'Stop' : 'Record'}
            </RecordButton>
            <ControlButton disabled={!isReady || isBusy} onClick={previewRecording} type="button">
              Preview
            </ControlButton>
          </ButtonGroup>
          <TrimLabel>
            <TrimCheckbox
              checked={autoTrim}
              disabled={isBusy || isRecording}
              onChange={event => setAutoTrim(event.target.checked)}
              type="checkbox"
            />
            Auto Trim
          </TrimLabel>
        </ControlRow>
        <NameRow>
          <NameLabel>Name</NameLabel>
          <NameInput
            aria-label="Recorded sample name"
            disabled={isBusy || isRecording}
            onChange={(event) => {
              setSampleName(event.target.value);
              if (error === 'Name required') {
                setError(null);
              }
            }}
            value={sampleName}
          />
        </NameRow>
        <ControlRow>
          <span />
          <ButtonGroup>
            <ControlButton onClick={handleClose} type="button">
              Cancel
            </ControlButton>
            <PrimaryButton
              $active
              disabled={!isReady || isBusy || isRecording || !sampleName.trim()}
              onClick={handleSave}
              type="button"
            >
              {status === 'saving' ? 'Saving' : 'Save'}
            </PrimaryButton>
          </ButtonGroup>
        </ControlRow>
        <ErrorText>{error || ''}</ErrorText>
      </Dialog>
    </Modal>
  );
};
