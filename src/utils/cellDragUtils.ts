import { GridCellData, SlotData } from '../types';

/**
 * A cell is addressed by slot + grid + index.
 *
 * Cell indexes restart in every grid block, so the grid id is required: a slot
 * holding a 1x1 block above a 2x2 block has two different cells at index 0.
 */
export interface CellAddress {
  slotId: string;
  gridId: string;
  cellIndex: number;
}

/** Read a cell address off the DOM data attributes the grid renders. */
export function resolveCellAddress(element: Element | null): CellAddress | null {
  if (!element) return null;
  const cellEl = element.closest('[data-cell-index]') as HTMLElement | null;
  const gridEl = element.closest('[data-grid-id]') as HTMLElement | null;
  const slotEl = element.closest('[data-slot-id]') as HTMLElement | null;
  if (!cellEl || !gridEl?.dataset.gridId || !slotEl?.dataset.slotId) return null;
  return {
    slotId: slotEl.dataset.slotId,
    gridId: gridEl.dataset.gridId,
    cellIndex: parseInt(cellEl.dataset.cellIndex || '0', 10),
  };
}

export function findCell(
  slots: SlotData[],
  addr: CellAddress
): GridCellData | undefined {
  return slots
    .find((s) => s.id === addr.slotId)
    ?.grids.find((g) => g.id === addr.gridId)?.cells[addr.cellIndex];
}

export function isSameCell(a: CellAddress, b: CellAddress): boolean {
  return a.slotId === b.slotId && a.gridId === b.gridId && a.cellIndex === b.cellIndex;
}

function writeCell(
  slots: SlotData[],
  addr: CellAddress,
  content: Omit<GridCellData, 'id'>
): SlotData[] {
  return slots.map((s) => {
    if (s.id !== addr.slotId) return s;
    return {
      ...s,
      grids: s.grids.map((g) => {
        if (g.id !== addr.gridId) return g;
        const cells = [...g.cells];
        if (!cells[addr.cellIndex]) return g;
        cells[addr.cellIndex] = { id: cells[addr.cellIndex].id, ...content };
        return { ...g, cells };
      }),
    };
  });
}

/**
 * Swap the contents of two cells, keeping each cell's own `id` in place — the
 * id belongs to the slot position, everything else is the card. Dropping onto
 * an empty cell swaps emptiness back into the source, which is the move case.
 * Returns the input untouched if either address does not resolve.
 */
export function swapCellContent(
  slots: SlotData[],
  source: CellAddress,
  target: CellAddress
): SlotData[] {
  const sourceCell = findCell(slots, source);
  const targetCell = findCell(slots, target);
  if (!sourceCell || !targetCell) return slots;

  const contentOf = (cell: GridCellData): Omit<GridCellData, 'id'> => {
    const { id, ...content } = cell;
    return content;
  };

  return writeCell(
    writeCell(slots, target, contentOf(sourceCell)),
    source,
    contentOf(targetCell)
  );
}
