import { SlotData, NodeItem, ActiveGraphContext } from '../types';

export const DEMO_GRAPH_CONTEXT: ActiveGraphContext = {
  id: 'demo-sandbox-graph-01',
  title: 'Demo Playground Knowledge Graph',
  description: 'A sandbox graph for testing overlays, fonts, card editing, and graph write-back',
  version: 1,
};

export const DEMO_GRAPH_NODES: NodeItem[] = [
  {
    id: 'demo-node-overlay',
    label: 'Overlay Formatting Test Card',
    category: 'Demo Sandbox',
    info: `[OVERLAY | font-family: var(--font-display); color: #00ffcc]
# Playground Overlay Header

This is text superimposed over a background image with custom font and accent color formatting!

![Modern Dashboard Illustration](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80)
[END OVERLAY]`,
    graphId: 'demo-sandbox-graph-01',
    sourceNodeId: 'demo-node-overlay',
    expectedVersion: 1,
  },
  {
    id: 'demo-node-content',
    label: 'Interactive Markdown & Styling',
    category: 'Demo Sandbox',
    info: `## Interactive Sandbox Card

You can edit this card, right-click text to apply custom **Fonts** and **Colors**, or click **Save** to confirm graph write-back!

- [x] Font family switching
- [x] Custom text color overlays
- [x] Node version tracking & confirmation prompt`,
    graphId: 'demo-sandbox-graph-01',
    sourceNodeId: 'demo-node-content',
    expectedVersion: 1,
  },
];

export const DEMO_GRAPH_SLOTS: SlotData[] = [
  {
    id: 'demo-slot-1',
    title: 'Demo Playground Canvas',
    grids: [
      {
        id: 'demo-grid-1',
        size: 2,
        cols: 2,
        cells: [
          {
            id: 'demo-cell-1',
            nodeId: 'demo-node-overlay',
            align: 'left',
            font: 'display',
            customMarkdown: DEMO_GRAPH_NODES[0].info,
            graphId: 'demo-sandbox-graph-01',
            sourceNodeId: 'demo-node-overlay',
            expectedVersion: 1,
          },
          {
            id: 'demo-cell-2',
            nodeId: 'demo-node-content',
            align: 'left',
            customMarkdown: DEMO_GRAPH_NODES[1].info,
            graphId: 'demo-sandbox-graph-01',
            sourceNodeId: 'demo-node-content',
            expectedVersion: 1,
          },
        ],
      },
    ],
  },
];
