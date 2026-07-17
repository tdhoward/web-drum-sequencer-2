import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import {
  applyPatternPackMapping,
  applyPresetMapping,
  closeMappingReview,
  createInitialMappingReviewSelections,
  createMappingReviewRows,
  createReviewedMappings,
  getPercussionTypeLabel,
  pendingMappingReviewSelector,
  updateMappingReviewSelection,
  type MappingReviewSelections,
  type PendingMappingReview,
} from '../../common';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { stopAllNotes } from '../../services/audioRouter';
import type { RootState } from '../../reducer';
import type { AppDispatch } from '../../store';
import { Modal } from '../Modal.component';
import { Button } from '../design-system';

const DialogPanel = styled.section`
  background: ${({ theme }) => theme.colors.surfacePanel};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  box-shadow: 0 1.25rem 4rem rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  max-width: 64rem;
  padding: 1.5rem;
  width: calc(100vw - 2rem);
`;

const DialogHeading = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
`;

const DialogDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.45;
  margin: 0 0 1rem;
`;

const MappingTableRegion = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  overflow: auto;
`;

const MappingTable = styled.table`
  border-collapse: collapse;
  min-width: 44rem;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    padding: 0.75rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: ${({ theme }) => theme.colors.surfacePanelRaised};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    position: sticky;
    text-transform: uppercase;
    top: 0;
    z-index: 1;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const LaneName = styled.div`
  font-weight: bold;
`;

const SecondaryText = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const ConfidenceBadge = styled.span<{ $needsAttention: boolean }>`
  background: ${({ $needsAttention, theme }) => (
    $needsAttention ? theme.colors.warningSubtle : theme.colors.surfacePanelRaised
  )};
  color: ${({ $needsAttention, theme }) => (
    $needsAttention ? theme.colors.warning : theme.colors.textSecondary
  )};
  display: inline-block;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.2rem 0.4rem;
  text-transform: uppercase;
`;

const TargetSelect = styled.select`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  max-width: 20rem;
  padding: 0.55rem;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

const DialogActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

type MappingReviewModalProps = {
  pending: PendingMappingReview | null;
  dispatch: AppDispatch;
};

const getSourceName = (source: PendingMappingReview['mappingResult']['mappings'][number]['source']) => (
  source.name || source.laneId || source.id
);

const getOperationName = (pending: PendingMappingReview): string => (
  pending.operation.type === 'kitPreset'
    ? pending.operation.preset.name
    : pending.operation.patternPack.name
);

const MappingReviewModalComponent = ({
  pending,
  dispatch,
}: MappingReviewModalProps) => {
  const [selections, setSelections] = useState<MappingReviewSelections>({});
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const rows = useMemo(
    () => (pending ? createMappingReviewRows(pending.mappingResult) : []),
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setSelections(createInitialMappingReviewSelections(pending.mappingResult));
    cancelButtonRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, [pending]);

  useEffect(() => {
    if (!pending) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dispatch(closeMappingReview());
        return;
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || []);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, pending]);

  if (!pending) return null;

  const handleTargetChange = (laneId: string, targetKitChannelId: string | null) => {
    setSelections(currentSelections => updateMappingReviewSelection(
      currentSelections,
      laneId,
      targetKitChannelId,
    ));
  };

  const handleApply = () => {
    const mappings = createReviewedMappings(
      pending.mappingResult,
      pending.targetKitChannels,
      selections,
    );

    if (pending.operation.type === 'kitPreset') {
      dispatch(applyPresetMapping(pending.operation.preset, mappings) as never);
      return;
    }

    stopAllNotes();
    clearScheduledNotes();
    dispatch(applyPatternPackMapping(pending.operation.patternPack, mappings) as never);
  };

  return (
    <Modal show>
      <DialogPanel
        aria-describedby="mapping-review-description"
        aria-labelledby="mapping-review-title"
        aria-modal="true"
        ref={dialogRef}
        role="dialog"
      >
        <DialogHeading id="mapping-review-title">Review channel mappings</DialogHeading>
        <DialogDescription id="mapping-review-description">
          {getOperationName(pending)} includes one or more uncertain channel matches.
          Choose where each pattern lane should play, or leave it silent.
        </DialogDescription>
        <MappingTableRegion tabIndex={0} aria-label="Channel mappings">
          <MappingTable>
            <thead>
              <tr>
                <th scope="col">Pattern lane</th>
                <th scope="col">Match</th>
                <th scope="col">Kit channel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const confidence = row.mapping?.confidence || 'unresolved';
                const reason = row.mapping?.reason || row.unresolved?.reason || '';
                const needsAttention = confidence === 'low' || confidence === 'unresolved';
                return (
                  <tr key={row.laneId}>
                    <td>
                      <LaneName>{getSourceName(row.source)}</LaneName>
                      <SecondaryText>
                        {getPercussionTypeLabel(row.source.percussionType || '')}
                        {' / '}
                        {row.laneId}
                      </SecondaryText>
                    </td>
                    <td>
                      <ConfidenceBadge $needsAttention={needsAttention}>
                        {confidence}
                      </ConfidenceBadge>
                      <SecondaryText>{reason}</SecondaryText>
                    </td>
                    <td>
                      <TargetSelect
                        aria-label={`Kit channel for ${getSourceName(row.source)}`}
                        onChange={event => handleTargetChange(
                          row.laneId,
                          event.target.value || null,
                        )}
                        value={selections[row.laneId] || ''}
                      >
                        <option value="">No channel - keep silent</option>
                        {pending.targetKitChannels.map(target => (
                          <option key={target.id} value={target.id}>
                            {target.name || target.id}
                            {' - '}
                            {getPercussionTypeLabel(target.percussionType || '')}
                          </option>
                        ))}
                      </TargetSelect>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </MappingTable>
        </MappingTableRegion>
        <DialogActions>
          <Button
            bg="surfacePanelRaised"
            color="textPrimary"
            onClick={() => dispatch(closeMappingReview())}
            p={2}
            ref={cancelButtonRef}
            type="button"
            width="auto"
          >
            Cancel
          </Button>
          <Button
            bg="actionPrimary"
            color="surfaceInverse"
            onClick={handleApply}
            p={2}
            type="button"
            width="auto"
          >
            Apply mappings
          </Button>
        </DialogActions>
      </DialogPanel>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  pending: pendingMappingReviewSelector(state),
});

export const MappingReviewModal = connect(mapStateToProps)(MappingReviewModalComponent);
