import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled, { useTheme } from 'styled-components';
import { getAudioRouterDiagnostics, playNote, stopAllNotes } from '../../services/audioRouter';
import { pitchToCents } from '../../services/audioScheduler';
import { notifyChannelTriggered } from '../../services/channelTriggerEvents';
import { summarizeAudioBuffer } from '../../services/sampleDiagnostics';
import { loadSampleBuffer } from '../../services/sampleStore';
import {
  DEFAULT_TRIM_FADE_SECONDS,
  cloneAudioBuffer,
  detectAudibleRange,
  renderEditedSampleBuffer,
  type SampleRange,
} from '../../services/sampleEditing';
import { Modal } from '../Modal.component';
import { drawWaveform } from '../SampleWaveform.component';

type SampleEditorChannel = {
  id: string;
  kitChannelId?: string;
  name?: string;
  sample?: string;
  pitchCoarse?: number;
  pitchFine?: number;
};

type SampleEditorModalProps = {
  channel: SampleEditorChannel | null;
  onClose: () => void;
  onSaveEditedSample: (audioBuffer: AudioBuffer) => Promise<void> | void;
};

type CanvasSize = {
  width: number;
  height: number;
};

type SelectionHandle = 'start' | 'end';

type SelectionState = SampleRange & {
  trimEnabled: boolean;
  normalizeEnabled: boolean;
};

type ToggleButtonProps = {
  $active?: boolean;
};

const MIN_SELECTION_SAMPLES = 8;
const POINTER_MOVE_DIAGNOSTIC_INTERVAL_MS = 250;
const SAMPLE_EDITOR_DIAG_PREFIX = '[SampleEditorDiag]';

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.4rem;
  box-shadow: 0 1.2rem 2.4rem rgba(0, 0, 0, 0.44);
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  padding: 1rem;
  width: min(56rem, calc(100vw - 2rem));
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

const WaveformFrame = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  height: min(15rem, 42vh);
  min-height: 10rem;
  overflow: hidden;
  position: relative;
  touch-action: none;
  width: 100%;
`;

const WaveformCanvas = styled.canvas`
  cursor: ew-resize;
  display: block;
  height: 100%;
  touch-action: none;
  width: 100%;
`;

const SelectionInfo = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-wrap: wrap;
  font-size: 0.75rem;
  gap: 0.6rem;
  justify-content: space-between;
`;

const ControlBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionRow = styled.div`
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

const PrimaryButton = styled(ControlButton)`
  min-width: 4rem;
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.errorBorder};
  font-size: 0.75rem;
  min-height: 1rem;
`;

const LoadingText = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  font-size: 0.8rem;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
`;

const createFullSelection = (audioBuffer: AudioBuffer): SelectionState => ({
  startSample: 0,
  endSample: audioBuffer.length,
  trimEnabled: false,
  normalizeEnabled: false,
});

const formatSeconds = (sampleIndex: number, sampleRate: number): string => (
  `${(sampleIndex / sampleRate).toFixed(3)} s`
);

const isFullSelection = (audioBuffer: AudioBuffer | null, selection: SelectionState): boolean => (
  !audioBuffer || (selection.startSample <= 0 && selection.endSample >= audioBuffer.length)
);

const drawSelectionOverlay = (
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  selection: SelectionState,
  accentColor: string,
): void => {
  const context = canvas.getContext('2d');
  if (!context || canvas.width === 0 || canvas.height === 0) {
    return;
  }

  const startX = Math.round((selection.startSample / audioBuffer.length) * canvas.width);
  const endX = Math.round((selection.endSample / audioBuffer.length) * canvas.width);
  const handleWidth = Math.max(3, Math.floor((window.devicePixelRatio || 1) * 3));

  context.fillStyle = selection.trimEnabled
    ? 'rgba(0, 0, 0, 0.52)'
    : 'rgba(0, 0, 0, 0.32)';
  context.fillRect(0, 0, startX, canvas.height);
  context.fillRect(endX, 0, canvas.width - endX, canvas.height);

  context.fillStyle = selection.trimEnabled
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.035)';
  context.fillRect(startX, 0, Math.max(1, endX - startX), canvas.height);

  context.fillStyle = accentColor;
  context.fillRect(startX, 0, handleWidth, canvas.height);
  context.fillRect(Math.max(startX, endX - handleWidth), 0, handleWidth, canvas.height);
};

const getSampleFromPointer = (
  event: React.PointerEvent<HTMLCanvasElement>,
  audioBuffer: AudioBuffer,
): number => {
  const rect = event.currentTarget.getBoundingClientRect();
  const pointerX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
  return Math.round((pointerX / rect.width) * audioBuffer.length);
};

const getNearestHandle = (
  event: React.PointerEvent<HTMLCanvasElement>,
  audioBuffer: AudioBuffer,
  selection: SampleRange,
): SelectionHandle => {
  const rect = event.currentTarget.getBoundingClientRect();
  const pointerX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
  const startX = (selection.startSample / audioBuffer.length) * rect.width;
  const endX = (selection.endSample / audioBuffer.length) * rect.width;

  return Math.abs(pointerX - startX) <= Math.abs(pointerX - endX) ? 'start' : 'end';
};

export const SampleEditorModal = ({
  channel,
  onClose,
  onSaveEditedSample,
}: SampleEditorModalProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const activeHandleRef = useRef<SelectionHandle | null>(null);
  const originalAudioBufferRef = useRef<AudioBuffer | null>(null);
  const diagnosticSequenceRef = useRef(0);
  const drawDiagnosticCountRef = useRef(0);
  const lastDrawDiagnosticRef = useRef(0);
  const lastPointerMoveDiagnosticRef = useRef(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selection, setSelection] = useState<SelectionState>({
    startSample: 0,
    endSample: 1,
    trimEnabled: false,
    normalizeEnabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleUrl = channel?.sample;
  const channelName = channel?.name || channel?.kitChannelId || channel?.id || 'Sample';
  const getSourceAudioBuffer = (): AudioBuffer | null => (
    originalAudioBufferRef.current || audioBuffer
  );

  const logDiagnostics = (
    eventName: string,
    extra: Record<string, unknown> = {},
    buffers: Record<string, AudioBuffer | null | undefined> = {},
  ) => {
    diagnosticSequenceRef.current += 1;
    const payload = {
      sequence: diagnosticSequenceRef.current,
      event: eventName,
      channel: channel ? {
        id: channel.id,
        kitChannelId: channel.kitChannelId,
        name: channel.name,
        sample: channel.sample,
        pitchCoarse: channel.pitchCoarse,
        pitchFine: channel.pitchFine,
      } : null,
      selection,
      canvasSize,
      sourceBufferId: getSourceAudioBuffer()
        ? summarizeAudioBuffer('source-id', getSourceAudioBuffer()).id
        : 'none',
      buffers: Object.entries({
        originalRef: originalAudioBufferRef.current,
        displayState: audioBuffer,
        source: getSourceAudioBuffer(),
        ...buffers,
      }).map(([label, buffer]) => summarizeAudioBuffer(label, buffer)),
      extra,
    };

    console.log(
      `${SAMPLE_EDITOR_DIAG_PREFIX} ${eventName} #${payload.sequence}\n${JSON.stringify(payload, null, 2)}`,
    );
  };

  useEffect(() => {
    let isCancelled = false;
    originalAudioBufferRef.current = null;
    setAudioBuffer(null);
    setError(null);
    setIsSaving(false);

    if (!sampleUrl) {
      setError('Sample unavailable');
      return undefined;
    }

    loadSampleBuffer(sampleUrl)
      .then((buffer) => {
        if (isCancelled) {
          return;
        }

        if (buffer) {
          logDiagnostics('load:decoded-store-buffer', {}, {
            decodedStoreBuffer: buffer,
          });
          const originalBuffer = cloneAudioBuffer(buffer);
          const editableBuffer = cloneAudioBuffer(originalBuffer);
          originalAudioBufferRef.current = originalBuffer;
          logDiagnostics('load:cloned-editor-buffers', {}, {
            decodedStoreBuffer: buffer,
            originalBuffer,
            editableBuffer,
          });
          setAudioBuffer(editableBuffer);
          setSelection(createFullSelection(editableBuffer));
        } else {
          setError('Sample unavailable');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Sample unavailable');
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
  }, [channel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const sourceAudioBuffer = getSourceAudioBuffer();

    if (sourceAudioBuffer && canvasSize.width > 0 && canvasSize.height > 0) {
      const drawBuffer = cloneAudioBuffer(sourceAudioBuffer);
      const now = Date.now();
      const shouldLogDraw = drawDiagnosticCountRef.current < 3
        || now - lastDrawDiagnosticRef.current >= POINTER_MOVE_DIAGNOSTIC_INTERVAL_MS;

      if (shouldLogDraw) {
        drawDiagnosticCountRef.current += 1;
        lastDrawDiagnosticRef.current = now;
        logDiagnostics('draw:before', {}, {
          sourceAudioBuffer,
          drawBuffer,
        });
      }
      drawWaveform(
        canvas,
        drawBuffer,
        String(theme.colors.waveform),
        String(theme.colors.waveformGuide),
      );
      drawSelectionOverlay(
        canvas,
        drawBuffer,
        selection,
        String(theme.colors.accentPrimary),
      );
      if (shouldLogDraw) {
        logDiagnostics('draw:after', {}, {
          sourceAudioBuffer,
          drawBuffer,
        });
      }
    }
  }, [
    audioBuffer,
    canvasSize.width,
    canvasSize.height,
    selection,
    theme,
  ]);

  const setSelectionHandle = useCallback((
    handle: SelectionHandle,
    sampleIndex: number,
  ) => {
    const sourceAudioBuffer = originalAudioBufferRef.current || audioBuffer;

    if (!sourceAudioBuffer) {
      return;
    }

    setSelection(previousSelection => {
      if (handle === 'start') {
        return {
          ...previousSelection,
          startSample: Math.min(
            Math.max(0, sampleIndex),
            previousSelection.endSample - MIN_SELECTION_SAMPLES,
          ),
        };
      }

      return {
        ...previousSelection,
        endSample: Math.max(
          Math.min(sourceAudioBuffer.length, sampleIndex),
          previousSelection.startSample + MIN_SELECTION_SAMPLES,
        ),
      };
    });
  }, [audioBuffer]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) {
      return;
    }

    const handle = getNearestHandle(event, audioBuffer, selection);
    activeHandleRef.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
    logDiagnostics('pointer:down', {
      handle,
      sampleIndex: getSampleFromPointer(event, audioBuffer),
    });
    setSelectionHandle(handle, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || !activeHandleRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastPointerMoveDiagnosticRef.current >= POINTER_MOVE_DIAGNOSTIC_INTERVAL_MS) {
      lastPointerMoveDiagnosticRef.current = now;
      logDiagnostics('pointer:move', {
        handle: activeHandleRef.current,
        sampleIndex: getSampleFromPointer(event, audioBuffer),
      });
    }

    setSelectionHandle(activeHandleRef.current, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    logDiagnostics('pointer:end', {
      hadCapture: event.currentTarget.hasPointerCapture(event.pointerId),
      pointerId: event.pointerId,
    });
    activeHandleRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const hasTrimEdit = Boolean(
    getSourceAudioBuffer()
      && selection.trimEnabled
      && !isFullSelection(getSourceAudioBuffer(), selection),
  );
  const hasEdits = hasTrimEdit || selection.normalizeEnabled;
  const sourceAudioBuffer = getSourceAudioBuffer();
  const selectedDuration = sourceAudioBuffer
    ? formatSeconds(selection.endSample - selection.startSample, sourceAudioBuffer.sampleRate)
    : '0.000 s';

  const renderCurrentEditedBuffer = (): AudioBuffer | null => {
    const originalBuffer = originalAudioBufferRef.current;

    if (!originalBuffer || !hasEdits) {
      logDiagnostics('render-edited:skipped', {
        hasOriginalBuffer: Boolean(originalBuffer),
        hasEdits,
      });
      return null;
    }

    logDiagnostics('render-edited:before', {
      hasTrimEdit,
      hasEdits,
    }, {
      originalBuffer,
    });
    const editedBuffer = renderEditedSampleBuffer(originalBuffer, {
      startSample: selection.trimEnabled ? selection.startSample : 0,
      endSample: selection.trimEnabled ? selection.endSample : originalBuffer.length,
      normalize: selection.normalizeEnabled,
      fadeSeconds: DEFAULT_TRIM_FADE_SECONDS,
    });
    logDiagnostics('render-edited:after', {
      hasTrimEdit,
      hasEdits,
    }, {
      originalBuffer,
      editedBuffer,
    });
    return editedBuffer;
  };

  const previewBuffer = (previewLabel: string, buffer: AudioBuffer | null) => {
    if (!buffer || !channel) {
      logDiagnostics(`preview:${previewLabel}:skipped`, {
        hasBuffer: Boolean(buffer),
        hasChannel: Boolean(channel),
      }, {
        previewBuffer: buffer,
      });
      return;
    }

    logDiagnostics(`preview:${previewLabel}:before-stop`, {
      audioRouter: getAudioRouterDiagnostics(channel.id),
      pitch: pitchToCents(channel),
    }, {
      previewBuffer: buffer,
    });
    stopAllNotes();
    logDiagnostics(`preview:${previewLabel}:after-stop`, {
      audioRouter: getAudioRouterDiagnostics(channel.id),
      pitch: pitchToCents(channel),
    }, {
      previewBuffer: buffer,
    });
    playNote(null, buffer, channel.id, pitchToCents(channel));
    logDiagnostics(`preview:${previewLabel}:after-play`, {
      audioRouter: getAudioRouterDiagnostics(channel.id),
      pitch: pitchToCents(channel),
    }, {
      previewBuffer: buffer,
    });
    notifyChannelTriggered(channel.id);
  };

  const handlePreviewOriginal = () => {
    const originalBuffer = originalAudioBufferRef.current;

    if (!originalBuffer) {
      logDiagnostics('preview-original:missing-original');
      return;
    }

    const previewOriginalBuffer = cloneAudioBuffer(originalBuffer);
    logDiagnostics('preview-original:clone', {}, {
      originalBuffer,
      previewOriginalBuffer,
    });
    previewBuffer('original', previewOriginalBuffer);
  };

  const handlePreviewEdited = () => {
    previewBuffer('edited', renderCurrentEditedBuffer());
  };

  const handleAutoSelect = () => {
    const originalBuffer = originalAudioBufferRef.current;

    if (!originalBuffer) {
      logDiagnostics('auto-select:missing-original');
      return;
    }

    logDiagnostics('auto-select:before', {}, {
      originalBuffer,
    });
    const detectedRange = detectAudibleRange(originalBuffer);
    logDiagnostics('auto-select:detected-range', {
      detectedRange,
    }, {
      originalBuffer,
    });
    setSelection(previousSelection => ({
      ...previousSelection,
      ...detectedRange,
    }));
  };

  const handleReset = () => {
    const originalBuffer = originalAudioBufferRef.current;

    if (!originalBuffer) {
      logDiagnostics('reset:missing-original');
      return;
    }

    logDiagnostics('reset:before', {}, {
      originalBuffer,
    });
    const resetBuffer = cloneAudioBuffer(originalBuffer);
    setError(null);
    setAudioBuffer(resetBuffer);
    setSelection(createFullSelection(resetBuffer));
    logDiagnostics('reset:after', {}, {
      originalBuffer,
      resetBuffer,
    });
  };

  const handleSave = () => {
    const editedBuffer = renderCurrentEditedBuffer();

    if (!channel || !editedBuffer || isSaving) {
      logDiagnostics('save:skipped', {
        hasChannel: Boolean(channel),
        hasEditedBuffer: Boolean(editedBuffer),
        isSaving,
      }, {
        editedBuffer,
      });
      return;
    }

    logDiagnostics('save:before', {
      isSaving,
    }, {
      editedBuffer,
    });
    setIsSaving(true);
    setError(null);
    Promise.resolve(onSaveEditedSample(editedBuffer))
      .then(() => {
        logDiagnostics('save:success', {}, {
          editedBuffer,
        });
        setIsSaving(false);
        stopAllNotes();
        onClose();
      })
      .catch(() => {
        logDiagnostics('save:error', {}, {
          editedBuffer,
        });
        setIsSaving(false);
        setError('Could not save sample');
      });
  };

  const handleClose = () => {
    logDiagnostics('close:before-stop', {
      audioRouter: channel ? getAudioRouterDiagnostics(channel.id) : null,
    });
    stopAllNotes();
    logDiagnostics('close:after-stop', {
      audioRouter: channel ? getAudioRouterDiagnostics(channel.id) : null,
    });
    onClose();
  };

  if (!channel) {
    return null;
  }

  return (
    <Modal show>
      <Dialog
        aria-label={`Edit ${channelName} sample`}
        aria-modal="true"
        role="dialog"
      >
        <Header>
          <Title>{`Edit ${channelName}`}</Title>
          <CloseButton aria-label="Close sample editor" onClick={handleClose} type="button">
            x
          </CloseButton>
        </Header>
        <WaveformFrame ref={frameRef}>
          <WaveformCanvas
            ref={canvasRef}
            aria-label="Sample trim selection"
            onPointerCancel={handlePointerEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
          />
          {!audioBuffer && !error && (
            <LoadingText>Loading</LoadingText>
          )}
        </WaveformFrame>
        <SelectionInfo>
          <span>
            {audioBuffer
              ? `${formatSeconds(selection.startSample, audioBuffer.sampleRate)} - ${formatSeconds(selection.endSample, audioBuffer.sampleRate)}`
              : '0.000 s - 0.000 s'}
          </span>
          <span>{selectedDuration}</span>
        </SelectionInfo>
        <ControlBar>
          <ControlButton disabled={!audioBuffer} onClick={handleAutoSelect} type="button">
            Auto Select
          </ControlButton>
          <ControlButton
            $active={selection.trimEnabled}
            disabled={!audioBuffer}
            onClick={() => {
              setSelection(previousSelection => ({
                ...previousSelection,
                trimEnabled: !previousSelection.trimEnabled,
              }));
            }}
            type="button"
          >
            Trim to Selection
          </ControlButton>
          <ControlButton
            $active={selection.normalizeEnabled}
            disabled={!audioBuffer}
            onClick={() => {
              setSelection(previousSelection => ({
                ...previousSelection,
                normalizeEnabled: !previousSelection.normalizeEnabled,
              }));
            }}
            type="button"
          >
            Normalize
          </ControlButton>
          <ControlButton disabled={!audioBuffer} onClick={handleReset} type="button">
            Reset
          </ControlButton>
        </ControlBar>
        <ActionRow>
          <ButtonGroup>
            <ControlButton
              disabled={!audioBuffer}
              onClick={handlePreviewOriginal}
              type="button"
            >
              Preview Original
            </ControlButton>
            <ControlButton
              disabled={!audioBuffer || !hasEdits}
              onClick={handlePreviewEdited}
              type="button"
            >
              Preview Edited
            </ControlButton>
          </ButtonGroup>
          <ButtonGroup>
            <ControlButton onClick={handleClose} type="button">
              Cancel
            </ControlButton>
            <PrimaryButton
              $active
              disabled={!audioBuffer || !hasEdits || isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? 'Saving' : 'OK'}
            </PrimaryButton>
          </ButtonGroup>
        </ActionRow>
        <ErrorText>{error || ''}</ErrorText>
      </Dialog>
    </Modal>
  );
};
