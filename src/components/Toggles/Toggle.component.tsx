import React from 'react';
import styled from 'styled-components';
import * as ss from 'styled-system';
import { Box } from '../design-system';
import { NoteVelocityPopover } from './NoteVelocityPopover.component';
import type {
  BorderRadiusProps,
  BordersProps,
  ColorProps,
  HeightProps,
  SpaceProps,
  WidthProps,
} from 'styled-system';

type BeatButtonProps =
  & ColorProps
  & SpaceProps
  & WidthProps
  & HeightProps
  & BordersProps
  & BorderRadiusProps
  & {
    $isActive: boolean;
    $velocityScale: number;
    $velocity: number;
  };

type BeatButtonDefaultProps = Pick<BeatButtonProps, 'border' | 'borderRadius'>;

type OpenVelocityEditorOptions = {
  createIfMissing: boolean;
};

type ToggleProps = {
  isActive: boolean;
  velocity: number;
  isVelocityEditorOpen: boolean;
  onClick: () => void;
  onOpenVelocityEditor: (options: OpenVelocityEditorOptions) => void;
  onChangeVelocity: (velocity: number) => void;
  onResetVelocity: () => void;
  beat: number;
};

const LONG_PRESS_MS = 550;
const LONG_PRESS_MOVE_TOLERANCE_PX = 8;
const MIN_VELOCITY_SCALE = 0.55;
const MAX_VELOCITY_SCALE = 1.22;

const getVelocityScale = (isActive: boolean, velocity: number): number => {
  if (!isActive) {
    return 1;
  }

  if (velocity <= 1) {
    return MIN_VELOCITY_SCALE + (velocity * (1 - MIN_VELOCITY_SCALE));
  }

  return Math.min(MAX_VELOCITY_SCALE, 1 + ((velocity - 1) * (MAX_VELOCITY_SCALE - 1)));
};

const ToggleRoot = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
`;

const BeatButton = styled.button.attrs<BeatButtonDefaultProps>(({
  border = 'none',
  borderRadius = '100%',
}) => ({ border, borderRadius }))<BeatButtonProps>`
  ${ss.color}
  ${ss.space}
  ${ss.width}
  ${ss.height}
  ${ss.borders}
  ${ss.borderRadius}
  padding: 0;
  outline: none;
  transition: background-color 0.1s, box-shadow 0.1s, transform 0.1s;
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-touch-callout: none;
  z-index: ${({ $isActive, $velocity }) => ($isActive && $velocity > 1 ? 2 : 1)};
  transform: scale(${({ $velocityScale }) => $velocityScale});
  transform-origin: center;
  background: ${({ $isActive, theme }) => ($isActive
    ? `linear-gradient(180deg, ${theme.colors.accentPrimaryActive} 0%, ${theme.colors.accentPrimary} 100%)`
    : theme.colors.sequencerBeatInactiveBackground)};

  &:focus {
    box-shadow: 0 0 5px 5px rgba(100, 180, 255, 0.5);
  }
`;

const clearLongPressTimer = (
  timerRef: React.MutableRefObject<ReturnType<typeof window.setTimeout> | null>,
): void => {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};


export const Toggle = ({
  isActive,
  velocity,
  isVelocityEditorOpen,
  onClick,
  onOpenVelocityEditor,
  onChangeVelocity,
  onResetVelocity,
  beat,
}: ToggleProps) => {
  const longPressTimerRef = React.useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const longPressTriggeredRef = React.useRef(false);
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const velocityPercent = Math.round(velocity * 100);
  const velocityScale = getVelocityScale(isActive, velocity);

  React.useEffect(() => () => {
    clearLongPressTimer(longPressTimerRef);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' || !isActive) {
      return;
    }

    longPressTriggeredRef.current = false;
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    clearLongPressTimer(longPressTimerRef);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onOpenVelocityEditor({ createIfMissing: false });
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const pointerStart = pointerStartRef.current;

    if (!pointerStart) {
      return;
    }

    const movement = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y,
    );

    if (movement > LONG_PRESS_MOVE_TOLERANCE_PX) {
      clearLongPressTimer(longPressTimerRef);
      pointerStartRef.current = null;
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer(longPressTimerRef);
    pointerStartRef.current = null;
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggeredRef.current = false;
      return;
    }

    onClick();
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const wasLongPress = longPressTriggeredRef.current;
    clearLongPressTimer(longPressTimerRef);
    pointerStartRef.current = null;

    if (wasLongPress) {
      onOpenVelocityEditor({ createIfMissing: false });
      return;
    }

    onOpenVelocityEditor({ createIfMissing: true });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      onOpenVelocityEditor({ createIfMissing: true });
    }
  };

  return (
    <ToggleRoot>
      <BeatButton
        type="button"
        $isActive={isActive}
        $velocityScale={velocityScale}
        $velocity={velocity}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onKeyDown={handleKeyDown}
        width={[18, 18, 18, 18, 18, 20, 24, 26]}
        height={[18, 18, 18, 18, 18, 20, 24, 26]}
        p={0}
        aria-haspopup="dialog"
        aria-expanded={isVelocityEditorOpen}
        aria-label={isActive
          ? `disable beat ${beat}, velocity ${velocityPercent} percent`
          : `enable beat ${beat}`}
      >
        <Box
          className="wds-beat-marker"
          data-beat={beat}
          data-active={isActive}
          position="absolute"
          bg="white"
          width="100%"
          height="100%"
          left={0}
          top={0}
          borderRadius="100%"
          style={{ opacity: 0, transform: 'scale(1)' }}
        />
      </BeatButton>
      {isVelocityEditorOpen && (
        <NoteVelocityPopover
          beat={beat}
          velocity={velocity}
          onChangeVelocity={onChangeVelocity}
          onResetVelocity={onResetVelocity}
        />
      )}
    </ToggleRoot>
  );
};
