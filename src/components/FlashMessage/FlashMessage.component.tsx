import React, { useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { FLASH_MESSAGES } from '../../common';

type FlashMessageComponentProps = {
  messageKey?: string | null;
  onDismiss: () => void;
  flashMessageVisible?: boolean;
};

type ToastTone = 'success' | 'error';

type ToastMessage = {
  title: string;
  detail?: string;
  tone: ToastTone;
};

const TOAST_MESSAGES: Record<string, ToastMessage> = {
  [FLASH_MESSAGES.SAMPLE_LOAD_ERROR]: {
    title: 'Sample couldn\'t load',
    detail: 'Check the sample file and try again.',
    tone: 'error',
  },
  [FLASH_MESSAGES.PRESET_SAVED]: {
    title: 'Kit saved',
    detail: 'Your user kit is ready to use.',
    tone: 'success',
  },
  [FLASH_MESSAGES.PRESET_DELETED]: {
    title: 'Kit deleted',
    tone: 'success',
  },
  [FLASH_MESSAGES.PATTERN_PACK_SAVED]: {
    title: 'Pattern pack saved',
    detail: 'Your user pattern pack is ready to use.',
    tone: 'success',
  },
  [FLASH_MESSAGES.PATTERN_PACK_DELETED]: {
    title: 'Pattern pack deleted',
    tone: 'success',
  },
  [FLASH_MESSAGES.PATTERN_PACK_EXPORTED]: {
    title: 'Pattern pack exported',
    tone: 'success',
  },
  [FLASH_MESSAGES.PATTERN_PACK_IMPORTED]: {
    title: 'Pattern pack imported',
    detail: 'The imported pattern pack is now selected.',
    tone: 'success',
  },
  [FLASH_MESSAGES.PATTERN_PACK_TRANSFER_ERROR]: {
    title: 'Pattern pack transfer failed',
    detail: 'The file may be invalid or incomplete. Check it and try again.',
    tone: 'error',
  },
  [FLASH_MESSAGES.SONG_SAVED]: {
    title: 'Song saved',
    detail: 'Your user song is ready to use.',
    tone: 'success',
  },
  [FLASH_MESSAGES.SONG_DELETED]: {
    title: 'Song deleted',
    tone: 'success',
  },
  [FLASH_MESSAGES.SONG_EXPORTED]: {
    title: 'Song exported',
    tone: 'success',
  },
  [FLASH_MESSAGES.SONG_IMPORTED]: {
    title: 'Song imported',
    detail: 'The imported song is now selected.',
    tone: 'success',
  },
  [FLASH_MESSAGES.SONG_TRANSFER_ERROR]: {
    title: 'Song transfer failed',
    detail: 'The file may be invalid or incomplete. Check it and try again.',
    tone: 'error',
  },
  [FLASH_MESSAGES.KIT_EXPORTED]: {
    title: 'Kit exported',
    tone: 'success',
  },
  [FLASH_MESSAGES.KIT_IMPORTED]: {
    title: 'Kit imported',
    detail: 'The imported kit is now selected.',
    tone: 'success',
  },
  [FLASH_MESSAGES.KIT_TRANSFER_ERROR]: {
    title: 'Kit transfer failed',
    detail: 'The file may be invalid or incomplete. Check it and try again.',
    tone: 'error',
  },
};

const enterToast = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 0.75rem, 0) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const exitToast = keyframes`
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    opacity: 0;
    transform: translate3d(0, 0.4rem, 0) scale(0.98);
  }
`;

const drainProgress = keyframes`
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
`;

const toneColor = css<{ $tone: ToastTone }>`
  ${({ $tone, theme }) => (
    $tone === 'error' ? theme.colors.danger : theme.colors.accentPrimary
  )}
`;

const Toast = styled.div<{ $tone: ToastTone; $visible: boolean }>`
  animation: ${({ $visible }) => ($visible ? enterToast : exitToast)}
    ${({ $visible }) => ($visible ? '260ms' : '180ms')}
    cubic-bezier(0.22, 1, 0.36, 1) forwards;
  background: ${({ theme }) => theme.colors.surfacePanelRaised};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-left: 4px solid ${toneColor};
  border-radius: 0.75rem;
  bottom: 1.5rem;
  box-shadow: 0 0.8rem 2.5rem rgba(0, 0, 0, 0.34),
    0 0.15rem 0.5rem rgba(0, 0, 0, 0.22);
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: grid;
  gap: 0.75rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  max-width: calc(100vw - 2rem);
  min-width: 20rem;
  overflow: hidden;
  padding: 0.9rem 0.75rem 1rem 1rem;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  position: fixed;
  right: 1.5rem;
  width: 24rem;
  z-index: 40;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
  }
`;

const StatusIcon = styled.div<{ $tone: ToastTone }>`
  align-items: center;
  background: ${({ $tone, theme }) => (
    $tone === 'error' ? theme.colors.dangerSubtle : theme.colors.accentPrimaryGlow
  )};
  border-radius: 50%;
  color: ${toneColor};
  display: flex;
  height: 2rem;
  justify-content: center;
  margin-top: 0.05rem;
  width: 2rem;

  svg {
    height: 1rem;
    width: 1rem;
  }
`;

const Message = styled.div`
  min-width: 0;
  padding-top: 0.05rem;
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25rem;
`;

const Detail = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8rem;
  line-height: 1.1rem;
  margin-top: 0.15rem;
`;

const CloseButton = styled.button`
  align-items: center;
  align-self: start;
  background: transparent;
  border: 0;
  border-radius: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  height: 1.8rem;
  justify-content: center;
  padding: 0;
  transition: background-color 150ms ease, color 150ms ease;
  width: 1.8rem;

  &:hover {
    background: ${({ theme }) => theme.colors.borderSubtle};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }

  svg {
    height: 0.8rem;
    width: 0.8rem;
  }
`;

const ProgressTrack = styled.div`
  background: ${({ theme }) => theme.colors.borderSubtle};
  bottom: 0;
  height: 2px;
  left: 0;
  position: absolute;
  right: 0;
`;

const Progress = styled.div<{ $duration: number; $tone: ToastTone }>`
  animation: ${drainProgress} ${({ $duration }) => $duration}ms linear forwards;
  background: ${toneColor};
  height: 100%;
  transform-origin: left;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SuccessIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="m3.25 8.2 3.05 3.05 6.45-6.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 4.15v4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="8" cy="11.65" r="1" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="m4 4 8 8m0-8-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const FlashMessageComponent = ({
  flashMessageVisible = false,
  messageKey,
  onDismiss,
}: FlashMessageComponentProps) => {
  const toastMessage = messageKey ? TOAST_MESSAGES[messageKey] : undefined;
  const duration = toastMessage?.tone === 'error' ? 8000 : 4500;

  useEffect(() => {
    if (!flashMessageVisible || !toastMessage) return undefined;

    const dismissTimer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(dismissTimer);
  }, [duration, flashMessageVisible, messageKey, onDismiss, toastMessage]);

  if (!toastMessage) return null;

  const isError = toastMessage.tone === 'error';

  return (
    <Toast
      $tone={toastMessage.tone}
      $visible={flashMessageVisible}
      aria-atomic="true"
      aria-hidden={!flashMessageVisible}
      aria-live={isError ? 'assertive' : 'polite'}
      role={isError ? 'alert' : 'status'}
    >
      <StatusIcon $tone={toastMessage.tone}>
        {isError ? <ErrorIcon /> : <SuccessIcon />}
      </StatusIcon>
      <Message>
        <Title>{toastMessage.title}</Title>
        {toastMessage.detail && <Detail>{toastMessage.detail}</Detail>}
      </Message>
      <CloseButton type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <CloseIcon />
      </CloseButton>
      {flashMessageVisible && (
        <ProgressTrack aria-hidden="true">
          <Progress
            key={messageKey}
            $duration={duration}
            $tone={toastMessage.tone}
          />
        </ProgressTrack>
      )}
    </Toast>
  );
};
