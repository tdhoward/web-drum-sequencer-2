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
  transformSampleAlignmentOffset,
  type SampleAlignmentTransform,
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
import { SampleRecorderModal } from '../SampleRecorderModal';
import {
  alignmentOffsetFromPointer,
  clampAlignmentOffset,
  drawWaveform,
  formatAlignmentOffset,
  shouldShowAlignmentIndicator,
} from '../SampleWaveform.component';
import {
  MAX_EDITOR_VELOCITY_LAYERS,
  MAX_LAYER_TRIM_DB,
  MIN_LAYER_TRIM_DB,
  addDraftVelocityLayer,
  applySavedSampleToDraft,
  getInitialVelocityLayerId,
  getLayerWorkspaceAriaLabel,
  getVelocityLayerPresentation,
  isValidVelocityLayerDraft,
  removeDraftVelocityLayer,
  setDraftLayerMaxVelocity,
  setDraftLayerMinVelocity,
  setDraftLayerAlignment,
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
  onCreateRecordedSample: (
    audioBuffer: AudioBuffer,
    sampleName: string,
  ) => Promise<string>;
  onCreateUploadedSample: (file: File) => Promise<string>;
  onSaveEditedSample: (
    audioBuffer: AudioBuffer,
    sourceName: string,
    sampleName: string,
    replaceSampleId?: string,
    alignmentTransform?: SampleAlignmentTransform,
  ) => Promise<string | void> | string | void;
  userSamples: UserSample[];
};

type CanvasSize = {
  width: number;
  height: number;
};

type SelectionHandle = 'start' | 'end';
type EditorMode = 'audio' | 'alignment';

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

type WaveformCanvasProps = {
  $mode: EditorMode;
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

const ModeControl = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
`;

const ModeButton = styled.button<ToggleButtonProps>`
  background: ${({ $active, theme }) => (
    $active ? theme.colors.accentPrimary : 'transparent'
  )};
  border: 0;
  color: ${({ $active, theme }) => (
    $active ? theme.colors.textInverse : theme.colors.textPrimary
  )};
  cursor: pointer;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.borderDefault};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderHover};
    outline-offset: -2px;
  }
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

const WaveformCanvas = styled.canvas<WaveformCanvasProps>`
  cursor: ${({ $mode }) => ($mode === 'audio' ? 'ew-resize' : 'crosshair')};
  display: block;
  height: 100%;
  touch-action: none;
  width: 100%;
`;

const AlignmentGuide = styled.span<{ $position: number; $interactive: boolean }>`
  background: ${({ theme }) => theme.colors.accentPrimary};
  bottom: 0;
  left: ${({ $position }) => `${$position}%`};
  opacity: ${({ $interactive }) => ($interactive ? 0.72 : 0.22)};
  pointer-events: none;
  position: absolute;
  top: 0.55rem;
  transform: translateX(-0.5px);
  width: 1px;
`;

const AlignmentMarker = styled.span<{ $position: number; $interactive: boolean }>`
  background: ${({ theme }) => theme.colors.accentPrimary};
  clip-path: polygon(0 0, 100% 0, 0 100%);
  height: 0.62rem;
  left: ${({ $position }) => `${$position}%`};
  opacity: ${({ $interactive }) => ($interactive ? 1 : 0.38)};
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 0.32rem;
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

const AlignmentControls = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AlignmentValue = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  flex: 1 1 10rem;
  font-size: 0.76rem;
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
  onCreateRecordedSample,
  onCreateUploadedSample,
  onSaveEditedSample,
  userSamples,
}: SampleEditorModalProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const activeHandleRef = useRef<SelectionHandle | null>(null);
  const activeAlignmentPointerRef = useRef<number | null>(null);
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
  const [editorMode, setEditorMode] = useState<EditorMode>('audio');
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
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
    setEditorMode('audio');
    setIsRecorderOpen(false);
    setIsSaving(false);
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
  const sourceAudioBuffer = audioBuffer;
  const hasTrimEdit = Boolean(
    sourceAudioBuffer
      && selection.trimEnabled
      && !isFullSelection(sourceAudioBuffer, selection),
  );
  const hasEdits = hasTrimEdit || selection.normalizeEnabled;
  const willReplaceExisting = hasEdits && canReplaceExisting && replaceExisting;
  const alignmentTransform: SampleAlignmentTransform = {
    trimStartSeconds: sourceAudioBuffer && hasTrimEdit
      ? selection.startSample / sourceAudioBuffer.sampleRate
      : 0,
    renderedDuration: sourceAudioBuffer
      ? (hasTrimEdit
        ? (selection.endSample - selection.startSample) / sourceAudioBuffer.sampleRate
        : sourceAudioBuffer.duration)
      : 0,
  };
  const renderedAlignmentOffset = transformSampleAlignmentOffset(
    selectedLayer?.alignmentOffset || 0,
    alignmentTransform,
  );
  const pendingRenderedBuffer = useMemo(() => {
    if (!sourceAudioBuffer || editorMode !== 'alignment' || !hasEdits) {
      return null;
    }
    return renderEditedSampleBuffer(sourceAudioBuffer, {
      startSample: hasTrimEdit ? selection.startSample : 0,
      endSample: hasTrimEdit ? selection.endSample : sourceAudioBuffer.length,
      normalize: selection.normalizeEnabled,
      fadeSeconds: DEFAULT_TRIM_FADE_SECONDS,
    });
  }, [
    editorMode,
    hasEdits,
    hasTrimEdit,
    selection.endSample,
    selection.normalizeEnabled,
    selection.startSample,
    sourceAudioBuffer,
  ]);
  const displayWaveformBuffer = editorMode === 'alignment'
    ? pendingRenderedBuffer || sourceAudioBuffer
    : sourceAudioBuffer;

  useEffect(() => {
    let isCancelled = false;
    originalAudioBufferRef.current = null;
    activeHandleRef.current = null;
    activeAlignmentPointerRef.current = null;
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
  }, [assetRevision, selectedLayerId, selectedSampleName, selectedSampleUrl]);

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
  }, [channel, selectedLayerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (displayWaveformBuffer) {
      const drawBuffer = cloneAudioBuffer(displayWaveformBuffer);
      drawWaveform(
        canvas,
        drawBuffer,
        String(theme.colors.waveform),
        String(theme.colors.waveformGuide),
      );
      if (editorMode === 'audio' && sourceAudioBuffer) {
        drawSelectionOverlay(
          canvas,
          sourceAudioBuffer,
          selection,
          String(theme.colors.accentPrimary),
        );
      }
    }
  }, [
    audioBuffer,
    canvasSize.height,
    canvasSize.width,
    displayWaveformBuffer,
    editorMode,
    selection,
    sourceAudioBuffer,
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

  const setRenderedAlignmentOffset = (alignmentOffset: number) => {
    if (!selectedLayer || !sourceAudioBuffer) {
      return;
    }
    const safeRenderedOffset = clampAlignmentOffset(
      alignmentOffset,
      alignmentTransform.renderedDuration,
    );
    const sourceAlignmentOffset = clampAlignmentOffset(
      safeRenderedOffset + alignmentTransform.trimStartSeconds,
      sourceAudioBuffer.duration,
    );
    setDraftLayers(previous => setDraftLayerAlignment(
      previous,
      selectedLayer.id,
      sourceAlignmentOffset,
    ));
  };

  const updateAlignmentFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!displayWaveformBuffer) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setRenderedAlignmentOffset(alignmentOffsetFromPointer(
      event.clientX,
      rect.left,
      rect.width,
      displayWaveformBuffer.duration,
    ));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || isSaving || isApplying) {
      return;
    }

    if (editorMode === 'alignment') {
      activeAlignmentPointerRef.current = event.pointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      updateAlignmentFromPointer(event);
      return;
    }

    const handle = getNearestHandle(event, audioBuffer, selection);
    activeHandleRef.current = handle;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSelectionHandle(handle, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      editorMode === 'alignment'
      && activeAlignmentPointerRef.current === event.pointerId
    ) {
      updateAlignmentFromPointer(event);
      return;
    }
    if (!audioBuffer || !activeHandleRef.current) {
      return;
    }
    setSelectionHandle(activeHandleRef.current, getSampleFromPointer(event, audioBuffer));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activeHandleRef.current = null;
    activeAlignmentPointerRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };
  const selectedDuration = sourceAudioBuffer
    ? formatSeconds(selection.endSample - selection.startSample, sourceAudioBuffer.sampleRate)
    : '0.000 s';

  const confirmDiscardAudioEdits = (): boolean => (
    !hasEdits
    || window.confirm('Discard the unsaved waveform edits for this layer?')
  );

  const selectLayer = (layerId: string) => {
    if (isSaving || isApplying || layerId === selectedLayerId || !confirmDiscardAudioEdits()) {
      return;
    }
    setSelectedLayerId(layerId);
  };

  const handleAddLayer = () => {
    if (isSaving || isApplying || !confirmDiscardAudioEdits()) {
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
    if (isSaving || isApplying || !confirmDiscardAudioEdits()) {
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

  const assignSampleUrlToDraftLayer = (layerId: string, sampleUrl: string) => {
    setDraftLayers(previous => (
      setDraftLayerSample(previous, layerId, sampleIdFromUrl(sampleUrl))
    ));
    setSampleUrlsByLayerId(previous => ({
      ...previous,
      [layerId]: sampleUrl,
    }));
    setAssetRevision(previous => previous + 1);
  };

  const handleSelectSample = (option: SampleSelectOption) => {
    if (!selectedLayer || !confirmDiscardAudioEdits()) {
      return;
    }
    assignSampleUrlToDraftLayer(selectedLayer.id, option.value);
  };

  const handleChooseFile = () => {
    if (!confirmDiscardAudioEdits()) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleSampleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedLayer || isSaving || isApplying) {
      return;
    }
    const targetLayerId = selectedLayer.id;
    setIsSaving(true);
    setError(null);
    Promise.resolve()
      .then(() => onCreateUploadedSample(file))
      .then((sampleUrl) => {
        assignSampleUrlToDraftLayer(targetLayerId, sampleUrl);
        setIsSaving(false);
      })
      .catch(() => {
        setIsSaving(false);
        setError('Could not save sample');
      });
  };

  const handleOpenRecorder = () => {
    if (!confirmDiscardAudioEdits()) {
      return;
    }
    setIsRecorderOpen(true);
  };

  const handleCreateRecordedSample = (
    recordedBuffer: AudioBuffer,
    recordedSampleName: string,
  ): Promise<void> => {
    const targetLayerId = selectedLayer?.id;
    if (!targetLayerId) {
      return Promise.reject(new Error('Selected layer unavailable'));
    }
    return Promise.resolve()
      .then(() => onCreateRecordedSample(recordedBuffer, recordedSampleName))
      .then((sampleUrl) => {
        assignSampleUrlToDraftLayer(targetLayerId, sampleUrl);
      });
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

  const handlePreviewAlignment = () => {
    const pendingBuffer = renderCurrentEditedBuffer();
    const originalBuffer = originalAudioBufferRef.current;
    previewBuffer(
      pendingBuffer || (originalBuffer ? cloneAudioBuffer(originalBuffer) : null),
    );
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
    setReplaceExisting(false);
    setSampleName(getDefaultEditedSampleName(selectedSampleName));
  };

  const applyDraftAndClose = (
    nextLayers: VelocityLayer[],
    nextSampleUrls: Record<string, string>,
  ): Promise<void> => {
    setIsApplying(true);
    setError(null);
    return Promise.resolve()
      .then(() => onApplyVelocityLayers(nextLayers, nextSampleUrls))
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

  const handlePrimaryAction = () => {
    if (!isValidVelocityLayerDraft(draftLayers) || isApplying || isSaving) {
      if (!isValidVelocityLayerDraft(draftLayers)) {
        setError('Velocity ranges are invalid');
      }
      return;
    }

    if (!hasEdits) {
      void applyDraftAndClose(
        draftLayers.map(layer => ({ ...layer })),
        { ...sampleUrlsByLayerId },
      );
      return;
    }

    const editedBuffer = renderCurrentEditedBuffer();
    const nextSampleName = sampleName.trim();
    if (!selectedLayer || !editedBuffer || !nextSampleName) {
      if (!nextSampleName) {
        setError('Name required');
      }
      return;
    }

    setIsSaving(true);
    setError(null);
    Promise.resolve()
      .then(() => onSaveEditedSample(
        editedBuffer,
        selectedSampleName,
        nextSampleName,
        willReplaceExisting ? selectedSampleUrl : undefined,
        alignmentTransform,
      ))
      .then((savedSampleUrl) => {
        const nextSampleUrl = savedSampleUrl || (
          willReplaceExisting ? selectedSampleUrl : undefined
        );
        if (!nextSampleUrl) {
          throw new Error('Saved sample URL unavailable');
        }
        const nextLayers = applySavedSampleToDraft({
          layers: draftLayers,
          selectedLayerId: selectedLayer.id,
          savedSampleId: sampleIdFromUrl(nextSampleUrl),
          replacedSampleId: willReplaceExisting ? selectedLayer.sampleId : undefined,
          alignmentTransform,
        });
        const nextSampleUrls = {
          ...sampleUrlsByLayerId,
          [selectedLayer.id]: nextSampleUrl,
        };
        if (willReplaceExisting) {
          nextLayers.forEach((layer) => {
            if (layer.sampleId === sampleIdFromUrl(nextSampleUrl)) {
              nextSampleUrls[layer.id] = nextSampleUrl;
            }
          });
        }
        setDraftLayers(nextLayers);
        setSampleUrlsByLayerId(nextSampleUrls);
        setAssetRevision(previous => previous + 1);
        setIsSaving(false);
        return applyDraftAndClose(nextLayers, nextSampleUrls);
      })
      .catch(() => {
        setIsSaving(false);
        setIsApplying(false);
        setError('Could not save sample');
      });
  };

  const handleClose = () => {
    if (isSaving || isApplying) {
      return;
    }
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
  const alignmentWaveformAriaLabel = (
    `Set ${selectedPresentation.label} ${selectedPresentation.rangeLabel} sample beat alignment`
  );
  const isSingleLayer = draftLayers.length === 1;
  const canAddLayer = draftLayers.length < MAX_EDITOR_VELOCITY_LAYERS
    && selectedPresentation.minVelocity < selectedPresentation.maxVelocity;
  const canRemoveLayer = draftLayers.length > 1;
  const isBusy = isSaving || isApplying;
  const visibleAlignmentOffset = editorMode === 'alignment'
    ? renderedAlignmentOffset
    : selectedLayer.alignmentOffset;
  const waveformDuration = displayWaveformBuffer?.duration || 0;
  const alignmentMarkerPosition = waveformDuration > 0
    ? (clampAlignmentOffset(visibleAlignmentOffset, waveformDuration) / waveformDuration) * 100
    : 0;
  const showAlignmentMarker = editorMode === 'alignment'
    || shouldShowAlignmentIndicator(visibleAlignmentOffset);
  const primaryActionLabel = isSaving
    ? 'Saving'
    : isApplying
      ? 'Applying'
      : hasEdits
        ? (willReplaceExisting ? 'Replace & Apply' : 'Save Copy & Apply')
        : 'Apply';

  return (
    <>
      <Modal show>
        <Dialog
        aria-label={`Edit ${channelName} samples`}
        aria-modal="true"
        role="dialog"
      >
        <Header>
          <Title>{`Edit ${channelName} Samples`}</Title>
          <CloseButton
            aria-label="Close sample editor"
            disabled={isBusy}
            onClick={handleClose}
            type="button"
          >
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
              disabled={isBusy}
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
                      disabled={isBusy}
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
                disabled={isBusy}
                onChooseFile={handleChooseFile}
                onRecordSample={handleOpenRecorder}
                onSelectSample={handleSelectSample}
                sample={selectedSampleUrl}
                sampleLoaded={
                  channel.velocityLayers.find(layer => layer.id === selectedLayer.id)
                    ?.sampleLoaded
                }
                userSamples={userSamples}
              />
              <input
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleSampleFileChosen}
                style={{ display: 'none' }}
                type="file"
              />
            </SampleRow>

            <ModeControl aria-label="Waveform editing mode">
              <ModeButton
                $active={editorMode === 'audio'}
                aria-pressed={editorMode === 'audio'}
                disabled={isBusy}
                onClick={() => setEditorMode('audio')}
                type="button"
              >
                Audio Edit
              </ModeButton>
              <ModeButton
                $active={editorMode === 'alignment'}
                aria-pressed={editorMode === 'alignment'}
                disabled={isBusy}
                onClick={() => setEditorMode('alignment')}
                type="button"
              >
                Beat Alignment
              </ModeButton>
            </ModeControl>

            <WaveformFrame ref={frameRef}>
              <WaveformCanvas
                ref={canvasRef}
                $mode={editorMode}
                aria-label={
                  editorMode === 'audio'
                    ? waveformAriaLabel
                    : alignmentWaveformAriaLabel
                }
                onPointerCancel={handlePointerEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
              />
              {displayWaveformBuffer && showAlignmentMarker && (
                <>
                  <AlignmentGuide
                    $interactive={editorMode === 'alignment'}
                    $position={alignmentMarkerPosition}
                    aria-hidden="true"
                  />
                  <AlignmentMarker
                    $interactive={editorMode === 'alignment'}
                    $position={alignmentMarkerPosition}
                    aria-hidden="true"
                  />
                </>
              )}
              {!audioBuffer && !error && (
                <LoadingText>Loading</LoadingText>
              )}
            </WaveformFrame>

            {editorMode === 'audio' ? (
              <>
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
                  <ControlButton
                    disabled={!audioBuffer || isBusy}
                    onClick={handleAutoSelect}
                    type="button"
                  >
                    Auto Select
                  </ControlButton>
                  <ControlButton
                    $active={selection.trimEnabled}
                    disabled={!audioBuffer || isBusy}
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
                    disabled={!audioBuffer || isBusy}
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
                  <ControlButton
                    disabled={!audioBuffer || isBusy}
                    onClick={handleReset}
                    type="button"
                  >
                    Reset
                  </ControlButton>
                </ControlBar>
              </>
            ) : (
              <AlignmentControls aria-label="Beat alignment controls">
                <AlignmentValue aria-live="polite">
                  {formatAlignmentOffset(renderedAlignmentOffset)}
                </AlignmentValue>
                <ControlButton
                  disabled={!audioBuffer || isBusy}
                  onClick={handlePreviewAlignment}
                  type="button"
                >
                  Preview
                </ControlButton>
                <ControlButton
                  disabled={!audioBuffer || isBusy}
                  onClick={() => setRenderedAlignmentOffset(0)}
                  type="button"
                >
                  Reset
                </ControlButton>
                <ControlButton
                  disabled={!audioBuffer || isBusy}
                  onClick={() => setRenderedAlignmentOffset(renderedAlignmentOffset - 0.01)}
                  type="button"
                >
                  -10 ms
                </ControlButton>
                <ControlButton
                  disabled={!audioBuffer || isBusy}
                  onClick={() => setRenderedAlignmentOffset(renderedAlignmentOffset + 0.01)}
                  type="button"
                >
                  +10 ms
                </ControlButton>
              </AlignmentControls>
            )}

            <LayerSettings aria-label="Selected layer settings">
              <NumberField>
                Range start
                <NumberInput
                  aria-label={`${selectedPresentation.label} minimum velocity`}
                  disabled={isBusy || selectedLayerIndex === 0}
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
                  disabled={isBusy || selectedLayerIndex === draftLayers.length - 1}
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
                  disabled={isBusy}
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

            {hasEdits && (
              <>
                <NameRow>
                  <FieldLabel>{willReplaceExisting ? 'Name' : 'Save As'}</FieldLabel>
                  <NameInput
                    aria-label="Edited sample name"
                    disabled={!audioBuffer || isBusy}
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
                      disabled={!audioBuffer || isBusy}
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
                        Replaces this library asset globally, including active and saved Kit
                        layers that use it.
                      </ReplaceHint>
                    </span>
                  </ReplaceOption>
                )}
              </>
            )}

            {editorMode === 'audio' && (
              <ControlBar>
                <ControlButton
                  disabled={!audioBuffer || isBusy}
                  onClick={handlePreviewOriginal}
                  type="button"
                >
                  Preview Original
                </ControlButton>
                <ControlButton
                  disabled={!audioBuffer || !hasEdits || isBusy}
                  onClick={handlePreviewEdited}
                  type="button"
                >
                  Preview Edited
                </ControlButton>
              </ControlBar>
            )}
          </Workspace>
        </EditorLayout>

        <ErrorText aria-live="polite">{error || ''}</ErrorText>
        <ActionRow>
          <span />
          <ButtonGroup>
            <ControlButton disabled={isBusy} onClick={handleClose} type="button">
              Cancel
            </ControlButton>
            <PrimaryButton
              $active
              disabled={
                !isValidVelocityLayerDraft(draftLayers)
                || (hasEdits && !sampleName.trim())
                || isBusy
              }
              onClick={handlePrimaryAction}
              type="button"
            >
              {primaryActionLabel}
            </PrimaryButton>
          </ButtonGroup>
        </ActionRow>
        </Dialog>
      </Modal>
      <SampleRecorderModal
        channelName={`${channelName} ${selectedPresentation.label}`}
        onClose={() => setIsRecorderOpen(false)}
        onSaveRecordedSample={handleCreateRecordedSample}
        show={isRecorderOpen}
      />
    </>
  );
};
