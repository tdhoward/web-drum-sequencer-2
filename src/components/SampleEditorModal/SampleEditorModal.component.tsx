import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled, { useTheme } from 'styled-components';
import {
  getReferenceVelocityLayer,
  getUserSampleDisplayName,
  getUserSampleId,
  sampleIdFromUrl,
  type UserSample,
  type VelocityLayer,
} from '../../common';
import { playNote, stopAllNotes } from '../../services/audioRouter';
import { pitchToCents } from '../../services/audioScheduler';
import { notifyChannelTriggered } from '../../services/channelTriggerEvents';
import { loadSampleBuffer } from '../../services/sampleStore';
import {
  DEFAULT_TRIM_FADE_SECONDS,
  cloneAudioBuffer,
  detectAudibleRange,
  renderEditedSampleBuffer,
  type SampleRange,
} from '../../services/sampleEditing';
import factorySamples from '../../samples.config';
import { Modal } from '../Modal.component';
import {
  SamplePicker,
  getSampleDisplayName,
  type SampleSelectOption,
} from '../SampleSelect';
import { drawWaveform } from '../SampleWaveform.component';
import {
  MAX_EDITOR_VELOCITY_LAYERS,
  MAX_LAYER_TRIM_DB,
  MIN_LAYER_TRIM_DB,
  addDraftVelocityLayer,
  getInitialVelocityLayerId,
  getLayerWorkspaceAriaLabel,
  getVelocityLayerPresentation,
  isValidVelocityLayerDraft,
  removeDraftVelocityLayer,
  setDraftLayerMaxVelocity,
  setDraftLayerMinVelocity,
  setDraftLayerSample,
  setDraftLayerTrim,
} from './SampleEditorModal.draft';

export type SampleEditorLayer = VelocityLayer & {
  sample?: string;
  sampleContentHash?: string;
  sampleLoaded?: boolean;
};

export type SampleEditorChannel = {
  id: string;
  kitChannelId?: string;
  name?: string;
  pitchCoarse?: number;
  pitchFine?: number;
  referenceVelocityLayerId?: string;
  velocityLayers: SampleEditorLayer[];
};

export type SampleEditorModalProps = {
  channel: SampleEditorChannel | null;
  initialSelectedLayerId?: string;
  onApplyVelocityLayers: (
    layers: VelocityLayer[],
    sampleUrlsByLayerId: Record<string, string>,
  ) => Promise<void> | void;
  onClose: () => void;
  onSaveEditedSample: (
    audioBuffer: AudioBuffer,
    sourceName: string,
    sampleName: string,
    replaceSampleId?: string,
  ) => Promise<string | void> | string | void;
  userSamples: UserSample[];
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

type LayerButtonProps = {
  $selected: boolean;
};

type EditorLayoutProps = {
  $singleLayer: boolean;
};

const MIN_SELECTION_SAMPLES = 8;
const SAMPLE_ID_PREFIX = 'sample:';

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.4rem;
  box-sizing: border-box;
  box-shadow: 0 1.2rem 2.4rem rgba(0, 0, 0, 0.44);
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-height: calc(100vh - 2rem);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 1rem;
  width: min(64rem, calc(100vw - 2rem));

  @media (max-width: 680px) {
    border-radius: 0;
    height: 100dvh;
    max-height: 100dvh;
    padding: 0.75rem;
    width: 100vw;
  }
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
  height: 2.75rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 2.75rem;

  &:hover, &:focus-visible {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const EditorLayout = styled.div<EditorLayoutProps>`
  display: grid;
  gap: 1rem;
  grid-template-columns: ${({ $singleLayer }) => (
    $singleLayer ? 'minmax(0, 1fr)' : '14rem minmax(0, 1fr)'
  )};
  min-height: 0;

  @media (max-width: 680px) {
    display: block;
  }
`;

const LayerRail = styled.aside`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.65rem;

  @media (max-width: 680px) {
    display: none;
  }
`;

const RailHeading = styled.h3`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  margin: 0 0 0.15rem;
  text-transform: uppercase;
`;

const LayerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const LayerButton = styled.button<LayerButtonProps>`
  background: ${({ $selected, theme }) => (
    $selected ? theme.colors.borderSubtle : 'transparent'
  )};
  border: 2px solid ${({ $selected, theme }) => (
    $selected ? theme.colors.accentPrimary : 'transparent'
  )};
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  display: grid;
  gap: 0.15rem 0.5rem;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 3.5rem;
  padding: 0.45rem 0.5rem;
  text-align: left;
  width: 100%;

  &:hover, &:focus-visible {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const LayerName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LayerRange = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
`;

const LayerSampleName = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.66rem;
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RailActions = styled.div`
  display: grid;
  gap: 0.4rem;
  grid-template-columns: 1fr 1fr;
  margin-top: auto;
`;

const CompactLayerBar = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  padding: 0.55rem 0.65rem;
`;

const CompactLayerText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.76rem;
  font-weight: 700;
`;

const MobileLayerControls = styled.div`
  display: none;
  gap: 0.5rem;
  margin-bottom: 0.8rem;

  @media (max-width: 680px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.75rem 2.75rem;
  }
`;

const MobileLayerSelect = styled.select`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 0.78rem;
  min-height: 2.75rem;
  min-width: 0;
  padding: 0.45rem;
`;

const Workspace = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;
`;

const SelectedSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  line-height: 1.3;
`;

const SummaryLead = styled.strong`
  color: ${({ theme }) => theme.colors.nearWhite};
  font-size: 0.84rem;
`;

const SummarySample = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SampleRow = styled.div`
  align-items: center;
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 4.5rem minmax(0, 1fr);
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const WaveformFrame = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  box-sizing: border-box;
  height: min(9.5rem, 30vh);
  min-height: 8rem;
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

const LayerSettings = styled.div`
  background: ${({ theme }) => theme.colors.borderSubtle};
  border-radius: 0.3rem;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(7rem, 1fr));
  padding: 0.7rem;

  @media (max-width: 540px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const NumberField = styled.label`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  font-size: 0.68rem;
  font-weight: 700;
  gap: 0.3rem;
  text-transform: uppercase;
`;

const NumberInput = styled.input`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 0.82rem;
  min-height: 2.75rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  width: 100%;

  &:disabled {
    opacity: 0.5;
  }
`;

const TrimValue = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.72rem;
  text-transform: none;
`;

const ActionRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;

  @media (max-width: 680px) {
    background: ${({ theme }) => theme.colors.surfacePanelRaised};
    bottom: -0.75rem;
    margin: 0 -0.75rem -0.75rem;
    padding: 0.7rem 0.75rem;
    position: sticky;
    z-index: 5;
  }
`;

const NameRow = styled.label`
  align-items: center;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  max-width: 32rem;
  width: 100%;
`;

const NameInput = styled.input`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 0.82rem;
  min-height: 2.75rem;
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

const ReplaceOption = styled.label`
  align-items: flex-start;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  font-size: 0.78rem;
  gap: 0.5rem;
  line-height: 1.35;
  max-width: 32rem;

  input {
    height: 1.25rem;
    margin: 0.1rem 0 0;
    width: 1.25rem;
  }
`;

const ReplaceHint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  display: block;
  font-size: 0.7rem;
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
    $active ? theme.colors.textInverse : theme.colors.textPrimary
  )};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:not(:disabled):hover, &:not(:disabled):focus-visible {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const SquareButton = styled(ControlButton)`
  padding: 0;
  width: 2.75rem;
`;

const PrimaryButton = styled(ControlButton)`
  min-width: 5rem;
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

const getDefaultEditedSampleName = (sourceName = 'Sample'): string => {
  const safeSourceName = sourceName.trim() || 'Sample';
  return `${safeSourceName} Edit`;
};

const isFullSelection = (
  audioBuffer: AudioBuffer | null,
  selection: SelectionState,
): boolean => (
  !audioBuffer || (selection.startSample <= 0 && selection.endSample >= audioBuffer.length)
);

const getSampleUrlFromId = (sampleId: string): string | undefined => (
  sampleId.startsWith(SAMPLE_ID_PREFIX)
    ? sampleId.slice(SAMPLE_ID_PREFIX.length)
    : undefined
);

const getInitialSampleUrls = (
  layers: readonly SampleEditorLayer[],
): Record<string, string> => layers.reduce<Record<string, string>>((result, layer) => {
  const sampleUrl = layer.sample || getSampleUrlFromId(layer.sampleId);
  if (sampleUrl) {
    result[layer.id] = sampleUrl;
  }
  return result;
}, {});

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
  initialSelectedLayerId,
  onApplyVelocityLayers,
  onClose,
  onSaveEditedSample,
  userSamples,
}: SampleEditorModalProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const activeHandleRef = useRef<SelectionHandle | null>(null);
  const originalAudioBufferRef = useRef<AudioBuffer | null>(null);
  const [draftLayers, setDraftLayers] = useState<VelocityLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState('');
  const [sampleUrlsByLayerId, setSampleUrlsByLayerId] = useState<Record<string, string>>({});
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selection, setSelection] = useState<SelectionState>({
    startSample: 0,
    endSample: 1,
    trimEnabled: false,
    normalizeEnabled: false,
  });
  const [sampleName, setSampleName] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [assetRevision, setAssetRevision] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextLayers = channel?.velocityLayers.map(layer => ({
      id: layer.id,
      sampleId: layer.sampleId,
      maxVelocity: layer.maxVelocity,
      alignmentOffset: layer.alignmentOffset,
      trimDb: layer.trimDb,
    })) || [];
    setDraftLayers(nextLayers);
    setSelectedLayerId(getInitialVelocityLayerId(
      nextLayers,
      initialSelectedLayerId || channel?.referenceVelocityLayerId,
    ));
    setSampleUrlsByLayerId(getInitialSampleUrls(channel?.velocityLayers || []));
    setIsApplying(false);
    setError(null);
  }, [channel, initialSelectedLayerId]);

  const selectedLayerIndex = draftLayers.findIndex(layer => layer.id === selectedLayerId);
  const selectedLayer = draftLayers[selectedLayerIndex];
  const selectedPresentation = getVelocityLayerPresentation(draftLayers, selectedLayerId);
  const selectedSampleUrl = selectedLayer
    ? sampleUrlsByLayerId[selectedLayer.id] || getSampleUrlFromId(selectedLayer.sampleId)
    : undefined;
  const selectedSampleName = getSampleDisplayName(selectedSampleUrl, userSamples);
  const channelName = channel?.name || channel?.kitChannelId || channel?.id || 'Sample';
  const referenceLayerId = getReferenceVelocityLayer(draftLayers)?.id;
  const isFactorySample = factorySamples.some(sample => sample.url === selectedSampleUrl);
  const selectedUserSample = !isFactorySample
    ? userSamples.find(userSample => getUserSampleId(userSample) === selectedSampleUrl)
    : undefined;
  const canReplaceExisting = Boolean(selectedUserSample);
  const existingSampleName = selectedUserSample
    ? getUserSampleDisplayName(selectedUserSample)
    : undefined;
  const getSourceAudioBuffer = (): AudioBuffer | null => (
    originalAudioBufferRef.current || audioBuffer
  );

  useEffect(() => {
    let isCancelled = false;
    originalAudioBufferRef.current = null;
    activeHandleRef.current = null;
    setAudioBuffer(null);
    setError(null);
    setIsSaving(false);
    setReplaceExisting(false);
    setSampleName(getDefaultEditedSampleName(selectedSampleName));

    if (!selectedSampleUrl) {
      setError('Sample unavailable');
      return undefined;
    }

    loadSampleBuffer(selectedSampleUrl)
      .then((buffer) => {
        if (isCancelled) {
          return;
        }

        if (buffer) {
          const originalBuffer = cloneAudioBuffer(buffer);
          const editableBuffer = cloneAudioBuffer(originalBuffer);
          originalAudioBufferRef.current = originalBuffer;
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
  }, [assetRevision, selectedSampleName, selectedSampleUrl]);

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
    }
  }, [
    audioBuffer,
    canvasSize.height,
    canvasSize.width,
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
      let nextSelection: SelectionState;

      if (handle === 'start') {
        nextSelection = {
          ...previousSelection,
          startSample: Math.min(
            Math.max(0, sampleIndex),
            previousSelection.endSample - MIN_SELECTION_SAMPLES,
          ),
        };
      } else {
        nextSelection = {
          ...previousSelection,
          endSample: Math.max(
            Math.min(sourceAudioBuffer.length, sampleIndex),
            previousSelection.startSample + MIN_SELECTION_SAMPLES,
          ),
        };
      }

      const selectionChanged = nextSelection.startSample !== previousSelection.startSample
        || nextSelection.endSample !== previousSelection.endSample;

      return selectionChanged
        ? {
          ...nextSelection,
          trimEnabled: true,
        }
        : previousSelection;
    });
  }, [audioBuffer]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) {
      return;
    }

    const handle = getNearestHandle(event, audioBuffer, selection);
    activeHandleRef.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectionHandle(handle, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || !activeHandleRef.current) {
      return;
    }
    setSelectionHandle(activeHandleRef.current, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activeHandleRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const sourceAudioBuffer = getSourceAudioBuffer();
  const hasTrimEdit = Boolean(
    sourceAudioBuffer
      && selection.trimEnabled
      && !isFullSelection(sourceAudioBuffer, selection),
  );
  const hasEdits = hasTrimEdit || selection.normalizeEnabled;
  const willReplaceExisting = canReplaceExisting && replaceExisting;
  const selectedDuration = sourceAudioBuffer
    ? formatSeconds(selection.endSample - selection.startSample, sourceAudioBuffer.sampleRate)
    : '0.000 s';

  const confirmDiscardAudioEdits = (): boolean => (
    !hasEdits
    || window.confirm('Discard the unsaved waveform edits for this layer?')
  );

  const selectLayer = (layerId: string) => {
    if (layerId === selectedLayerId || !confirmDiscardAudioEdits()) {
      return;
    }
    setSelectedLayerId(layerId);
  };

  const handleAddLayer = () => {
    if (!confirmDiscardAudioEdits()) {
      return;
    }
    const transition = addDraftVelocityLayer(draftLayers, selectedLayerId);
    setDraftLayers(transition.layers);
    setSelectedLayerId(transition.selectedLayerId);
    const newLayer = transition.layers.find(layer => layer.id === transition.selectedLayerId);
    if (newLayer && !sampleUrlsByLayerId[newLayer.id] && selectedSampleUrl) {
      setSampleUrlsByLayerId(previous => ({
        ...previous,
        [newLayer.id]: selectedSampleUrl,
      }));
    }
  };

  const handleRemoveLayer = () => {
    if (!confirmDiscardAudioEdits()) {
      return;
    }
    const transition = removeDraftVelocityLayer(draftLayers, selectedLayerId);
    setDraftLayers(transition.layers);
    setSelectedLayerId(transition.selectedLayerId);
    setSampleUrlsByLayerId(previous => {
      const nextUrls = { ...previous };
      delete nextUrls[selectedLayerId];
      return nextUrls;
    });
  };

  const handleSelectSample = (option: SampleSelectOption) => {
    if (!selectedLayer || !confirmDiscardAudioEdits()) {
      return;
    }
    setDraftLayers(previous => (
      setDraftLayerSample(previous, selectedLayer.id, sampleIdFromUrl(option.value))
    ));
    setSampleUrlsByLayerId(previous => ({
      ...previous,
      [selectedLayer.id]: option.value,
    }));
  };

  const renderCurrentEditedBuffer = (): AudioBuffer | null => {
    const originalBuffer = originalAudioBufferRef.current;
    if (!originalBuffer || !hasEdits) {
      return null;
    }

    return renderEditedSampleBuffer(originalBuffer, {
      startSample: selection.trimEnabled ? selection.startSample : 0,
      endSample: selection.trimEnabled ? selection.endSample : originalBuffer.length,
      normalize: selection.normalizeEnabled,
      fadeSeconds: DEFAULT_TRIM_FADE_SECONDS,
    });
  };

  const previewBuffer = (buffer: AudioBuffer | null) => {
    if (!buffer || !channel || !selectedLayer) {
      return;
    }

    stopAllNotes();
    playNote(
      null,
      buffer,
      channel.id,
      pitchToCents(channel),
      64,
      selectedLayer.trimDb,
    );
    notifyChannelTriggered(channel.id);
  };

  const handlePreviewOriginal = () => {
    const originalBuffer = originalAudioBufferRef.current;
    if (originalBuffer) {
      previewBuffer(cloneAudioBuffer(originalBuffer));
    }
  };

  const handlePreviewEdited = () => {
    previewBuffer(renderCurrentEditedBuffer());
  };

  const handleAutoSelect = () => {
    const originalBuffer = originalAudioBufferRef.current;
    if (!originalBuffer) {
      return;
    }
    const detectedRange = detectAudibleRange(originalBuffer);
    setSelection(previousSelection => {
      const selectionChanged = detectedRange.startSample !== previousSelection.startSample
        || detectedRange.endSample !== previousSelection.endSample;
      return {
        ...previousSelection,
        ...detectedRange,
        trimEnabled: selectionChanged ? true : previousSelection.trimEnabled,
      };
    });
  };

  const handleReset = () => {
    const originalBuffer = originalAudioBufferRef.current;
    if (!originalBuffer) {
      return;
    }
    const resetBuffer = cloneAudioBuffer(originalBuffer);
    setError(null);
    setAudioBuffer(resetBuffer);
    setSelection(createFullSelection(resetBuffer));
  };

  const handleSave = () => {
    const editedBuffer = renderCurrentEditedBuffer();
    const nextSampleName = sampleName.trim();
    if (
      !selectedLayer
      || !editedBuffer
      || isSaving
      || !nextSampleName
    ) {
      if (!nextSampleName) {
        setError('Name required');
      }
      return;
    }

    setIsSaving(true);
    setError(null);
    Promise.resolve(onSaveEditedSample(
      editedBuffer,
      selectedSampleName,
      nextSampleName,
      willReplaceExisting ? selectedSampleUrl : undefined,
    ))
      .then((savedSampleUrl) => {
        const nextSampleUrl = savedSampleUrl || (
          willReplaceExisting ? selectedSampleUrl : undefined
        );
        if (!nextSampleUrl) {
          throw new Error('Saved sample URL unavailable');
        }
        setDraftLayers(previous => (
          setDraftLayerSample(previous, selectedLayer.id, sampleIdFromUrl(nextSampleUrl))
        ));
        setSampleUrlsByLayerId(previous => ({
          ...previous,
          [selectedLayer.id]: nextSampleUrl,
        }));
        setAssetRevision(previous => previous + 1);
        setIsSaving(false);
      })
      .catch(() => {
        setIsSaving(false);
        setError('Could not save sample');
      });
  };

  const handleApply = () => {
    if (
      !isValidVelocityLayerDraft(draftLayers)
      || isApplying
      || isSaving
      || hasEdits
    ) {
      if (hasEdits) {
        setError('Save or reset waveform edits before applying');
      } else if (!isValidVelocityLayerDraft(draftLayers)) {
        setError('Velocity ranges are invalid');
      }
      return;
    }

    setIsApplying(true);
    setError(null);
    Promise.resolve(onApplyVelocityLayers(
      draftLayers.map(layer => ({ ...layer })),
      { ...sampleUrlsByLayerId },
    ))
      .then(() => {
        setIsApplying(false);
        stopAllNotes();
        onClose();
      })
      .catch(() => {
        setIsApplying(false);
        setError('Could not apply sample layers');
      });
  };

  const handleClose = () => {
    stopAllNotes();
    onClose();
  };

  const layerPresentations = useMemo(() => draftLayers.map(layer => ({
    layer,
    presentation: getVelocityLayerPresentation(draftLayers, layer.id),
  })), [draftLayers]);

  if (!channel || !selectedLayer || !selectedPresentation) {
    return null;
  }

  const previousBoundary = draftLayers[selectedLayerIndex - 2]?.maxVelocity || 0;
  const nextBoundary = draftLayers[selectedLayerIndex + 1]?.maxVelocity || 127;
  const selectedLayerSummary = (
    `${selectedPresentation.label} · ${selectedPresentation.rangeLabel}`
  );
  const waveformAriaLabel = getLayerWorkspaceAriaLabel(
    selectedPresentation.label,
    selectedPresentation.rangeLabel,
  );
  const isSingleLayer = draftLayers.length === 1;
  const canAddLayer = draftLayers.length < MAX_EDITOR_VELOCITY_LAYERS
    && selectedPresentation.minVelocity < selectedPresentation.maxVelocity;
  const canRemoveLayer = draftLayers.length > 1;

  return (
    <Modal show>
      <Dialog
        aria-label={`Edit ${channelName} samples`}
        aria-modal="true"
        role="dialog"
      >
        <Header>
          <Title>{`Edit ${channelName} Samples`}</Title>
          <CloseButton aria-label="Close sample editor" onClick={handleClose} type="button">
            ×
          </CloseButton>
        </Header>

        {isSingleLayer && (
          <CompactLayerBar>
            <CompactLayerText>Velocity Layers: 1</CompactLayerText>
            <ControlButton
              disabled={!canAddLayer || isSaving || isApplying}
              onClick={handleAddLayer}
              type="button"
            >
              Add Layer
            </ControlButton>
          </CompactLayerBar>
        )}

        {!isSingleLayer && (
          <MobileLayerControls>
            <MobileLayerSelect
              aria-label="Selected velocity layer"
              onChange={event => selectLayer(event.target.value)}
              value={selectedLayerId}
            >
              {layerPresentations.map(({ layer, presentation }) => (
                presentation && (
                  <option key={layer.id} value={layer.id}>
                    {`Layer ${presentation.index + 1} of ${draftLayers.length} · `}
                    {`${presentation.label} · ${presentation.rangeLabel}`}
                  </option>
                )
              ))}
            </MobileLayerSelect>
            <SquareButton
              aria-label="Add velocity layer"
              disabled={!canAddLayer || isSaving || isApplying}
              onClick={handleAddLayer}
              type="button"
            >
              +
            </SquareButton>
            <SquareButton
              aria-label="Remove selected velocity layer"
              disabled={!canRemoveLayer || isSaving || isApplying}
              onClick={handleRemoveLayer}
              type="button"
            >
              −
            </SquareButton>
          </MobileLayerControls>
        )}

        <EditorLayout $singleLayer={isSingleLayer}>
          {!isSingleLayer && (
            <LayerRail aria-label="Velocity layers">
              <RailHeading>Velocity Layers</RailHeading>
              <LayerList>
                {layerPresentations.map(({ layer, presentation }) => {
                  if (!presentation) {
                    return null;
                  }
                  const layerSampleUrl = sampleUrlsByLayerId[layer.id]
                    || getSampleUrlFromId(layer.sampleId);
                  const isSelected = layer.id === selectedLayerId;
                  return (
                    <LayerButton
                      key={layer.id}
                      $selected={isSelected}
                      aria-label={
                        `${presentation.label}, velocities ${presentation.rangeLabel}, `
                        + `${getSampleDisplayName(layerSampleUrl, userSamples)}, `
                        + `${layer.trimDb.toFixed(1)} dB`
                      }
                      aria-pressed={isSelected}
                      onClick={() => selectLayer(layer.id)}
                      type="button"
                    >
                      <LayerName>
                        {presentation.label}
                        {layer.id === referenceLayerId ? ' •' : ''}
                      </LayerName>
                      <LayerRange>{presentation.rangeLabel}</LayerRange>
                      <LayerSampleName>
                        {`${getSampleDisplayName(layerSampleUrl, userSamples)} · `}
                        {`${layer.trimDb.toFixed(1)} dB`}
                      </LayerSampleName>
                    </LayerButton>
                  );
                })}
              </LayerList>
              <RailActions>
                <ControlButton
                  disabled={!canAddLayer || isSaving || isApplying}
                  onClick={handleAddLayer}
                  type="button"
                >
                  Add Layer
                </ControlButton>
                <ControlButton
                  disabled={!canRemoveLayer || isSaving || isApplying}
                  onClick={handleRemoveLayer}
                  type="button"
                >
                  Remove Layer
                </ControlButton>
              </RailActions>
            </LayerRail>
          )}

          <Workspace aria-label={`${selectedLayerSummary} settings`}>
            <SelectedSummary>
              <SummaryLead>{`Selected: ${selectedLayerSummary}`}</SummaryLead>
              <SummarySample>{`· ${selectedSampleName}`}</SummarySample>
            </SelectedSummary>

            <SampleRow>
              <FieldLabel>Sample</FieldLabel>
              <SamplePicker
                ariaLabel={`Select sample for ${selectedLayerSummary}`}
                onSelectSample={handleSelectSample}
                sample={selectedSampleUrl}
                sampleLoaded={
                  channel.velocityLayers.find(layer => layer.id === selectedLayer.id)
                    ?.sampleLoaded
                }
                userSamples={userSamples}
              />
            </SampleRow>

            <WaveformFrame ref={frameRef}>
              <WaveformCanvas
                ref={canvasRef}
                aria-label={waveformAriaLabel}
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
                  ? `${formatSeconds(selection.startSample, audioBuffer.sampleRate)} - `
                    + `${formatSeconds(selection.endSample, audioBuffer.sampleRate)}`
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
                  setSelection(previous => ({
                    ...previous,
                    trimEnabled: !previous.trimEnabled,
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
                  setSelection(previous => ({
                    ...previous,
                    normalizeEnabled: !previous.normalizeEnabled,
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

            <LayerSettings aria-label="Selected layer settings">
              <NumberField>
                Range start
                <NumberInput
                  aria-label={`${selectedPresentation.label} minimum velocity`}
                  disabled={selectedLayerIndex === 0}
                  max={selectedLayer.maxVelocity - 1}
                  min={previousBoundary + 2}
                  onChange={event => {
                    setDraftLayers(previous => setDraftLayerMinVelocity(
                      previous,
                      selectedLayer.id,
                      Number(event.target.value),
                    ));
                  }}
                  type="number"
                  value={selectedPresentation.minVelocity}
                />
              </NumberField>
              <NumberField>
                Range end
                <NumberInput
                  aria-label={`${selectedPresentation.label} maximum velocity`}
                  disabled={selectedLayerIndex === draftLayers.length - 1}
                  max={nextBoundary - 1}
                  min={selectedPresentation.minVelocity}
                  onChange={event => {
                    setDraftLayers(previous => setDraftLayerMaxVelocity(
                      previous,
                      selectedLayer.id,
                      Number(event.target.value),
                    ));
                  }}
                  type="number"
                  value={selectedPresentation.maxVelocity}
                />
              </NumberField>
              <NumberField>
                <span>
                  Layer trim <TrimValue>{`${selectedLayer.trimDb.toFixed(1)} dB`}</TrimValue>
                </span>
                <NumberInput
                  aria-label={`${selectedPresentation.label} layer trim in decibels`}
                  max={MAX_LAYER_TRIM_DB}
                  min={MIN_LAYER_TRIM_DB}
                  onChange={event => {
                    setDraftLayers(previous => setDraftLayerTrim(
                      previous,
                      selectedLayer.id,
                      Number(event.target.value),
                    ));
                  }}
                  step="0.5"
                  type="number"
                  value={selectedLayer.trimDb}
                />
              </NumberField>
            </LayerSettings>

            <NameRow>
              <FieldLabel>{willReplaceExisting ? 'Name' : 'Save As'}</FieldLabel>
              <NameInput
                aria-label="Edited sample name"
                disabled={!audioBuffer || isSaving || isApplying}
                onChange={(event) => {
                  setSampleName(event.target.value);
                  if (error === 'Name required') {
                    setError(null);
                  }
                }}
                value={sampleName}
              />
            </NameRow>

            {canReplaceExisting && (
              <ReplaceOption>
                <input
                  checked={replaceExisting}
                  disabled={!audioBuffer || isSaving || isApplying}
                  onChange={(event) => {
                    const shouldReplace = event.target.checked;
                    setReplaceExisting(shouldReplace);
                    setSampleName(shouldReplace
                      ? existingSampleName?.trim() || selectedSampleName
                      : getDefaultEditedSampleName(selectedSampleName));
                  }}
                  type="checkbox"
                />
                <span>
                  Replace existing user sample
                  <ReplaceHint>
                    Keeps this sample in place and updates every layer that uses it.
                  </ReplaceHint>
                </span>
              </ReplaceOption>
            )}

            <ControlBar>
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
              <ControlButton
                disabled={!audioBuffer || !hasEdits || isSaving || !sampleName.trim()}
                onClick={handleSave}
                type="button"
              >
                {isSaving ? 'Saving' : willReplaceExisting ? 'Replace Sample' : 'Save Copy'}
              </ControlButton>
            </ControlBar>
          </Workspace>
        </EditorLayout>

        <ErrorText aria-live="polite">{error || ''}</ErrorText>
        <ActionRow>
          <span />
          <ButtonGroup>
            <ControlButton disabled={isSaving || isApplying} onClick={handleClose} type="button">
              Cancel
            </ControlButton>
            <PrimaryButton
              $active
              disabled={
                !isValidVelocityLayerDraft(draftLayers)
                || hasEdits
                || isSaving
                || isApplying
              }
              onClick={handleApply}
              type="button"
            >
              {isApplying ? 'Applying' : 'Apply'}
            </PrimaryButton>
          </ButtonGroup>
        </ActionRow>
      </Dialog>
    </Modal>
  );
};
