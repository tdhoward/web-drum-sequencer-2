import React from 'react';
import styled from 'styled-components';
import { Box, Text } from '../design-system';
import { RemoveButton } from '../ChannelButtons';

export type SongPatternRow = { id: string; name: string };

type Props = {
  arrangementPatternIds: Array<string | null>;
  arrangementIndex: number;
  isSongPlaying: boolean;
  patterns: SongPatternRow[];
  onSelectCell: (columnIndex: number, patternId: string, selected: boolean) => void;
  onDeleteColumn: (columnIndex: number) => void;
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

const ColumnLabel = styled.div<{ $playing: boolean }>`
  align-items: center;
  background: ${({ $playing, theme }) => ($playing ? theme.colors.accentPrimary : 'transparent')};
  border-radius: 0.3rem;
  color: ${({ $playing, theme }) => ($playing ? theme.colors.textInverse : theme.colors.textMuted)};
  display: flex;
  font-size: 0.65rem;
  font-weight: 600;
  height: 1.35rem;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
  width: 2.35rem;
`;

const Cell = styled.button<{ $selected: boolean; $playing: boolean }>`
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
  padding: 0;
  width: 2.35rem;

  &:hover { border-color: ${({ theme }) => theme.colors.borderHover}; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

const DeleteCell = styled.div`
  align-items: center;
  display: flex;
  height: 2rem;
  justify-content: center;
  width: 2.35rem;
`;

export const SongSequencerComponent = ({
  arrangementPatternIds,
  arrangementIndex,
  isSongPlaying,
  patterns,
  onSelectCell,
  onDeleteColumn,
}: Props) => {
  const columnCount = arrangementPatternIds.length + 1;

  return (
    <Panel aria-label="Song arrangement">
      <Box mb={3}>
        <Text color="textPrimary" fontSize={3} fontWeight="bold">Song arrangement</Text>
        <Text color="textSecondary" fontSize={2} mt={1}>
          Choose one pattern in each column. Selecting the last column adds another.
        </Text>
      </Box>
      <div role="grid" aria-label="Pattern sequence">
        <GridRow $columns={columnCount} role="row">
          <RowName aria-hidden="true" />
          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <ColumnLabel
              key={columnIndex}
              $playing={isSongPlaying && arrangementIndex === columnIndex}
              role="columnheader"
            >
              {columnIndex + 1}
            </ColumnLabel>
          ))}
        </GridRow>
        {patterns.map(pattern => (
          <GridRow key={pattern.id} $columns={columnCount} role="row">
            <RowName role="rowheader" title={pattern.name}>{pattern.name}</RowName>
            {Array.from({ length: columnCount }, (_, columnIndex) => {
              const selected = arrangementPatternIds[columnIndex] === pattern.id;
              const playing = isSongPlaying && arrangementIndex === columnIndex && selected;
              return (
                <Cell
                  key={columnIndex}
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
