import { Sortable } from '@shopify/draggable';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Box, Text } from '../design-system';
import { RemoveButton } from '../ChannelButtons';

export type SongPatternRow = { id: string; name: string };

type Props = {
  arrangementPatternIds: string[][];
  arrangementIndex: number;
  isSongPlaying: boolean;
  patterns: SongPatternRow[];
  onSelectCell: (columnIndex: number, patternId: string, selected: boolean) => void;
  onDeleteColumn: (columnIndex: number) => void;
  onReorderColumn: (oldIndex: number, newIndex: number) => void;
};

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanel};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.5rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding: 1rem;
`;

const GridRow = styled.div<{ $columns: number }>`
  align-items: center;
  display: grid;
  gap: 0.4rem;
  grid-template-columns: minmax(6rem, 8rem) repeat(${({ $columns }) => $columns}, 2.35rem);
  margin-bottom: 0.4rem;
  min-width: max-content;
`;

const RowName = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanel};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.8rem;
  font-weight: 600;
  left: 0;
  overflow: hidden;
  padding-right: 0.7rem;
  position: sticky;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 2;
`;

const PENDING_COLUMN_OPACITY = 0.68;

const ColumnHeadingContainer = styled.div<{ $columns: number }>`
  display: grid;
  gap: 0.4rem;
  grid-column: 2 / -1;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 2.35rem);
`;

const ColumnLabel = styled.div<{ $pending: boolean; $playing: boolean }>`
  align-items: center;
  background: ${({ $playing, theme }) => ($playing ? theme.colors.accentPrimary : 'transparent')};
  border-radius: 0.3rem;
  color: ${({ $playing, theme }) => ($playing ? theme.colors.textInverse : theme.colors.textMuted)};
  cursor: grab;
  display: flex;
  font-size: 0.65rem;
  font-weight: 600;
  height: 1.35rem;
  justify-content: center;
  opacity: ${({ $pending }) => ($pending ? PENDING_COLUMN_OPACITY : 1)};
  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
  user-select: none;
  width: 2.35rem;

  &:hover { opacity: 1; }
  &:active { cursor: grabbing; }
  &.draggable-source--is-dragging { opacity: 0.2; }
  &.draggable-mirror {
    background: ${({ theme }) => theme.colors.surfacePanelRaised};
    opacity: 0.9;
    z-index: 10;
  }
`;

const Cell = styled.button<{ $pending: boolean; $selected: boolean; $playing: boolean }>`
  background: ${({ $selected, theme }) => ($selected
    ? theme.colors.accentPrimary
    : theme.colors.sequencerBeatInactiveBackground)};
  border: 1px solid ${({ $selected, theme }) => ($selected
    ? theme.colors.accentPrimaryActive
    : theme.colors.borderSubtle)};
  border-radius: 0.3rem;
  box-shadow: ${({ $playing, theme }) => ($playing
    ? `0 0 0 2px ${theme.colors.accentPrimaryGlow}`
    : 'none')};
  cursor: pointer;
  height: 2.35rem;
  opacity: ${({ $pending }) => ($pending ? PENDING_COLUMN_OPACITY : 1)};
  padding: 0;
  transition: border-color 0.15s ease, opacity 0.15s ease;
  width: 2.35rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
    opacity: 1;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
    opacity: 1;
  }
`;

const DeleteCell = styled.div`
  align-items: center;
  display: flex;
  height: 2rem;
  justify-content: center;
  padding-top: 0.5rem;
  width: 2.35rem;
`;

export const SongSequencerComponent = ({
  arrangementPatternIds,
  arrangementIndex,
  isSongPlaying,
  patterns,
  onSelectCell,
  onDeleteColumn,
  onReorderColumn,
}: Props) => {
  const columnHeadingContainer = useRef<HTMLDivElement | null>(null);
  const [sortVersion, setSortVersion] = useState(0);
  const columnCount = arrangementPatternIds.length + 1;
  const pendingColumnIndex = columnCount - 1;

  useEffect(() => {
    const container = columnHeadingContainer.current;
    if (!container) return undefined;

    const sortable = new Sortable([container], {
      draggable: '.wds-song-column',
      handle: '.wds-song-column',
      mirror: {
        constrainDimensions: true,
      },
    });
    sortable.on('sortable:stop', ({ oldIndex, newIndex }) => {
      if (oldIndex !== newIndex) {
        onReorderColumn(oldIndex, newIndex);
        setSortVersion(version => version + 1);
      }
    });

    return () => sortable.destroy();
  }, [onReorderColumn, sortVersion]);

  return (
    <Panel aria-label="Song arrangement">
      <Box mb={3}>
        <Text color="textPrimary" fontSize={3} fontWeight="bold">Song arrangement</Text>
        <Text color="textSecondary" fontSize={2} mt={1}>
          Choose any patterns to play together in each column. Drag a column number to reorder it;
          using or moving the last column adds another.
        </Text>
      </Box>
      <div role="grid" aria-label="Pattern sequence">
        <GridRow $columns={columnCount} role="row">
          <RowName aria-hidden="true" />
          <ColumnHeadingContainer
            key={sortVersion}
            $columns={columnCount}
            ref={columnHeadingContainer}
          >
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <ColumnLabel
                key={columnIndex}
                $pending={columnIndex === pendingColumnIndex}
                $playing={isSongPlaying && arrangementIndex === columnIndex}
                aria-label={`Song column ${columnIndex + 1}. Drag to reorder.`}
                className="wds-song-column"
                role="columnheader"
              >
                {columnIndex + 1}
              </ColumnLabel>
            ))}
          </ColumnHeadingContainer>
        </GridRow>
        {patterns.map(pattern => (
          <GridRow key={pattern.id} $columns={columnCount} role="row">
            <RowName role="rowheader" title={pattern.name}>{pattern.name}</RowName>
            {Array.from({ length: columnCount }, (_, columnIndex) => {
              const selected = arrangementPatternIds[columnIndex]?.includes(pattern.id) || false;
              const playing = isSongPlaying && arrangementIndex === columnIndex && selected;
              return (
                <Cell
                  key={columnIndex}
                  $pending={columnIndex === pendingColumnIndex}
                  $selected={selected}
                  $playing={playing}
                  aria-label={`${selected ? 'Remove' : 'Use'} ${pattern.name} at song position ${columnIndex + 1}`}
                  aria-pressed={selected}
                  onClick={() => onSelectCell(columnIndex, pattern.id, selected)}
                  role="gridcell"
                  type="button"
                />
              );
            })}
          </GridRow>
        ))}
        <GridRow $columns={columnCount} role="row">
          <RowName aria-hidden="true" />
          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <DeleteCell key={columnIndex} role="gridcell">
              {columnIndex < arrangementPatternIds.length && (
                <RemoveButton
                  ariaLabel={`Delete song column ${columnIndex + 1}`}
                  onClick={() => onDeleteColumn(columnIndex)}
                />
              )}
            </DeleteCell>
          ))}
        </GridRow>
      </div>
    </Panel>
  );
};
