import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from 'react';
import styled, { css, keyframes } from 'styled-components';
import { HoverButton } from '../design-system';
import { subscribeToChannelTriggers } from '../../services/channelTriggerEvents';

const HIT_TRIGGER_DURATION_MS = 220;

type HitButtonChannel = {
  sample?: string | {
    name?: string;
  };
  name?: string;
  id?: string;
  kitChannelId?: string;
};

type HitButtonProps = {
  channel: HitButtonChannel;
  onMouseDown: () => void;
};

type StyledHitButtonProps = {
  $isTriggered: boolean;
};

const hitButtonTriggerPulse = keyframes`
  0% {
    background-color: var(--hit-button-bg);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    transform: scale(1);
  }

  22% {
    background-color: var(--hit-button-trigger-bg);
    box-shadow: 0 0 0 5px var(--hit-button-trigger-glow);
    transform: scale(1.14);
  }

  100% {
    background-color: var(--hit-button-bg);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    transform: scale(1);
  }
`;

const StyledHitButton = styled(HoverButton)<StyledHitButtonProps>`
  --hit-button-bg: ${({ theme }) => theme.colors.hitButtonBackground};
  --hit-button-trigger-bg: ${({ theme }) => theme.colors.accentPrimary};
  --hit-button-trigger-glow: ${({ theme }) => theme.colors.accentPrimaryGlow};

  transform-origin: center;

  ${({ $isTriggered }) => $isTriggered && css`
    animation: ${hitButtonTriggerPulse} ${HIT_TRIGGER_DURATION_MS}ms ease-out;
  `}
`;

const getSampleLabel = (channel: HitButtonChannel): string => {
  if (typeof channel.sample === 'string') {
    return channel.name || channel.sample || channel.id || 'channel';
  }

  return channel.sample?.name || channel.name || channel.id || 'channel';
};

const getTriggerChannelId = (channel: HitButtonChannel): string | undefined => (
  channel.id || channel.kitChannelId
);

export const HitButton = ({ channel, onMouseDown }: HitButtonProps) => {
  const [isTriggered, setIsTriggered] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const resetTimeout = useRef<number | null>(null);
  const triggerChannelId = getTriggerChannelId(channel);

  const restartTriggerAnimation = useCallback(() => {
    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current);
    }

    if (resetTimeout.current !== null) {
      window.clearTimeout(resetTimeout.current);
    }

    setIsTriggered(false);
    animationFrame.current = window.requestAnimationFrame(() => {
      animationFrame.current = null;
      setIsTriggered(true);
      resetTimeout.current = window.setTimeout(() => {
        resetTimeout.current = null;
        setIsTriggered(false);
      }, HIT_TRIGGER_DURATION_MS);
    });
  }, []);

  useEffect(() => {
    if (!triggerChannelId) {
      return undefined;
    }

    const unsubscribe = subscribeToChannelTriggers((channelId) => {
      if (channelId === triggerChannelId) {
        restartTriggerAnimation();
      }
    });

    return () => {
      unsubscribe();

      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }

      if (resetTimeout.current !== null) {
        window.clearTimeout(resetTimeout.current);
      }
    };
  }, [restartTriggerAnimation, triggerChannelId]);

  return (
    <StyledHitButton
      $isTriggered={isTriggered}
      height={40}
      width={40}
      minWidth={40}
      bg="hitButtonBackground"
      hoverBg="hitButtonBackgroundHover"
      activeBg="hitButtonBackgroundActive"
      transitionSpeed="0.1s"
      ml={2}
      p={0}
      onMouseDown={() => onMouseDown()}
      onTouchStart={() => onMouseDown()}
      onTouchEnd={(event: TouchEvent<HTMLButtonElement>) => event.preventDefault()}
      aria-label={`Play ${getSampleLabel(channel)}`}
    />
  );
};
