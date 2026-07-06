import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { playNote, stopAllNotes } from '../../services/audioRouter';
import { loadSampleBuffer } from '../../services/sampleStore';
import {
  getUserSampleDisplayName,
  getUserSampleId,
  normalizeUserSample,
  type LegacyChannel,
  type UserSample,
  type UserSampleRecord,
} from '../../common';
import { Modal } from '../Modal.component';

const SAMPLE_MANAGER_PREVIEW_CHANNEL_ID = 'sample-manager-preview';

type SampleManagerModalProps = {
  channels: LegacyChannel[];
  onClose: () => void;
  onDeleteSample: (sampleId: string) => Promise<void> | void;
  onRenameSample: (sampleId: string, name: string) => void;
  show: boolean;
  userSamples: UserSample[];
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
  overflow: hidden;
  padding: 1rem;
  width: min(44rem, calc(100vw - 2rem));
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

const SampleList = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  max-height: min(31rem, calc(100vh - 8rem));
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
`;

const SampleRow = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  display: grid;
  gap: 0.6rem;
  grid-template-columns: minmax(0, 1fr) minmax(7rem, 10.5rem) 4rem 4.8rem 4.4rem;
  padding: 0.55rem;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  }

  @media (max-width: 640px) {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
`;

const NameInput = styled.input`
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 0.82rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.colors.borderHover};
    outline: 0;
  }
`;

const UsageText = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
  line-height: 1.25;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  min-height: 2.1rem;
  padding: 0.5rem 0.65rem;
  white-space: nowrap;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:not(:disabled):hover, &:not(:disabled):focus-visible {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const PlayButton = styled(ActionButton)`
  color: ${({ theme }) => theme.colors.accentPrimary};
`;

const DeleteButton = styled(ActionButton)`
  color: ${({ theme }) => theme.colors.danger};
`;

const EmptyState = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.82rem;
  padding: 1rem;
`;

const getChannelLabel = (channel: LegacyChannel): string => (
  channel.name || channel.kitChannelId || channel.id
);

const getSampleUsageLabels = (
  sampleId: string,
  channels: LegacyChannel[],
): string[] => channels
  .filter(channel => channel.sample === sampleId)
  .map(getChannelLabel);

const getDraftNames = (userSamples: UserSample[]): Record<string, string> => (
  userSamples.reduce<Record<string, string>>((draftNames, userSample) => {
    draftNames[getUserSampleId(userSample)] = getUserSampleDisplayName(userSample);
    return draftNames;
  }, {})
);

export const SampleManagerModalComponent = ({
  channels,
  onClose,
  onDeleteSample,
  onRenameSample,
  show,
  userSamples,
}: SampleManagerModalProps) => {
  const normalizedSamples = useMemo<UserSampleRecord[]>(
    () => userSamples.map(normalizeUserSample),
    [userSamples],
  );
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [deletingSampleId, setDeletingSampleId] = useState<string | null>(null);
  const [previewingSampleId, setPreviewingSampleId] = useState<string | null>(null);
  const [previewErrorSampleId, setPreviewErrorSampleId] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setDraftNames(getDraftNames(userSamples));
      setDeletingSampleId(null);
      setPreviewingSampleId(null);
      setPreviewErrorSampleId(null);
    }
  }, [show, userSamples]);

  const closeManager = () => {
    stopAllNotes();
    setPreviewingSampleId(null);
    onClose();
  };

  const renameSample = (sample: UserSampleRecord) => {
    const nextName = (draftNames[sample.id] || '').trim();
    const currentName = getUserSampleDisplayName(sample);

    if (!nextName || nextName === currentName) {
      setDraftNames(previousDraftNames => ({
        ...previousDraftNames,
        [sample.id]: currentName,
      }));
      return;
    }

    onRenameSample(sample.id, nextName);
  };

  const deleteSample = (sample: UserSampleRecord) => {
    const usageLabels = getSampleUsageLabels(sample.id, channels);

    if (usageLabels.length > 0) {
      return;
    }

    if (!window.confirm(`Delete sample "${getUserSampleDisplayName(sample)}"?`)) {
      return;
    }

    setDeletingSampleId(sample.id);
    Promise.resolve(onDeleteSample(sample.id))
      .catch(() => {
        // The thunk owns the user-facing failure message.
      })
      .finally(() => {
        setDeletingSampleId(null);
      });
  };

  const previewSample = (sample: UserSampleRecord) => {
    setPreviewErrorSampleId(null);
    setPreviewingSampleId(sample.id);

    loadSampleBuffer(sample.id)
      .then((buffer) => {
        if (!buffer) {
          setPreviewErrorSampleId(sample.id);
          return;
        }

        stopAllNotes();
        playNote(null, buffer, SAMPLE_MANAGER_PREVIEW_CHANNEL_ID);
      })
      .catch(() => {
        setPreviewErrorSampleId(sample.id);
      })
      .finally(() => {
        setPreviewingSampleId(previousSampleId => (
          previousSampleId === sample.id ? null : previousSampleId
        ));
      });
  };

  if (!show) {
    return null;
  }

  return (
    <Modal show={show}>
      <Dialog aria-label="Manage user samples" aria-modal="true" role="dialog">
        <Header>
          <Title>User Samples</Title>
          <CloseButton aria-label="Close sample manager" onClick={closeManager} type="button">
            x
          </CloseButton>
        </Header>
        {normalizedSamples.length === 0 ? (
          <EmptyState>No user samples</EmptyState>
        ) : (
          <SampleList>
            {normalizedSamples.map((sample) => {
              const draftName = draftNames[sample.id] ?? getUserSampleDisplayName(sample);
              const usageLabels = getSampleUsageLabels(sample.id, channels);
              const isInUse = usageLabels.length > 0;
              const usageText = previewErrorSampleId === sample.id
                ? 'Could not play'
                : isInUse ? `Used by ${usageLabels.join(', ')}` : 'Unused';
              const hasChanged = Boolean(
                draftName.trim()
                  && draftName.trim() !== getUserSampleDisplayName(sample),
              );

              return (
                <SampleRow key={sample.id}>
                  <NameInput
                    aria-label={`Name for ${getUserSampleDisplayName(sample)}`}
                    onBlur={() => renameSample(sample)}
                    onChange={(event) => {
                      setDraftNames(previousDraftNames => ({
                        ...previousDraftNames,
                        [sample.id]: event.target.value,
                      }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        renameSample(sample);
                      }
                    }}
                    value={draftName}
                  />
                  <UsageText title={usageText}>
                    {usageText}
                  </UsageText>
                  <PlayButton
                    disabled={previewingSampleId === sample.id}
                    onClick={() => previewSample(sample)}
                    type="button"
                  >
                    {previewingSampleId === sample.id ? '...' : 'Play'}
                  </PlayButton>
                  <ActionButton
                    disabled={!hasChanged}
                    onClick={() => renameSample(sample)}
                    type="button"
                  >
                    Rename
                  </ActionButton>
                  <DeleteButton
                    disabled={isInUse || deletingSampleId === sample.id}
                    onClick={() => deleteSample(sample)}
                    title={isInUse ? 'Sample is currently assigned to a channel' : undefined}
                    type="button"
                  >
                    Delete
                  </DeleteButton>
                </SampleRow>
              );
            })}
          </SampleList>
        )}
      </Dialog>
    </Modal>
  );
};
