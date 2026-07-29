export type FontToken = 'display' | 'sans' | 'script' | 'mono';

export interface VegvisrUser {
  email: string;
  role: 'admin' | 'user' | string;
  user_id: string;
  emailVerificationToken: string;
}

export type ColorToken =
  | '--text'
  | '--muted'
  | '--accent'
  | '--accent2'
  | '--primary'
  | '--soft';

export type NodeCategory =
  | 'Hero'
  | 'Content'
  | 'Features'
  | 'Media'
  | 'CTA'
  | 'Custom'
  | 'Imported Graphs'
  | string;

export interface NodeItem {
  id: string;
  label: string;
  category: NodeCategory;
  info: string; // Markdown content
  graphId?: string; // Vegvisr Graph ID if imported
  sourceNodeId?: string; // Vegvisr Node ID if imported
  expectedVersion?: number;
}

export interface GridCellData {
  id: string;
  nodeId: string | null;
  align: 'left' | 'center' | 'right';
  font?: FontToken;
  color?: ColorToken;
  customMarkdown?: string; // Overridden content specific to this cell
  graphId?: string; // Vegvisr Graph ID if imported
  sourceNodeId?: string; // Vegvisr Node ID if imported
  expectedVersion?: number;
  transparentBg?: boolean; // Seamless card with no background or border
  bgImage?: string; // Background image URL or base64
  bgOverlay?: number; // Overlay opacity 0 to 1
  bgFit?: 'cover' | 'contain' | 'repeat'; // Sizing/repetition mode
}

export interface GridBlockData {
  id: string;
  size: number; // e.g. 1, 2, 3, 4 (size x size grid)
  cols?: number; // optionally explicit columns
  rows?: number; // optionally explicit rows
  cells: GridCellData[];
  transparentBg?: boolean; // Seamless grid block with no background or border
  bgImage?: string; // Background image URL or base64
  bgOverlay?: number; // Overlay opacity 0 to 1
  bgFit?: 'cover' | 'contain' | 'repeat';
}

export interface SlotData {
  id: string;
  title: string;
  grids: GridBlockData[];
  transparentBg?: boolean; // Seamless slot section with no background or border
  bgImage?: string; // Background image URL or base64
  bgOverlay?: number; // Overlay opacity 0 to 1
  bgFit?: 'cover' | 'contain' | 'repeat';
}

export interface Theme {
  id: string;
  name: string;
  category: 'Dark Luxury' | 'Modern Light' | 'Vibrant & Bold' | 'Minimalist' | 'Brand Catalog' | string;
  vars: {
    '--bg1': string;
    '--bg2': string;
    '--text': string;
    '--muted': string;
    '--accent': string;
    '--accent2': string;
    '--primary': string;
    '--card-bg': string;
    '--card-border': string;
    '--soft': string;
    '--radius': string;
    '--font-display'?: string;
    '--font-sans'?: string;
    '--font-script'?: string;
    '--font-mono'?: string;
    '--font-import'?: string;
    [key: string]: string | undefined;
  };
}

export interface ActiveGraphContext {
  id: string;
  title: string;
  description?: string;
  version?: number;
  updatedAt?: string;
}

export type AppMode = 'editor' | 'view' | 'portfolio';

export interface DragItemPayload {
  kind: 'size' | 'node' | 'cell';
  n?: number;
  rows?: number; // explicit row count for non-square grid tiles (e.g. 1 x N row layouts)
  nodeId?: string;
  label: string;
  // kind 'cell': where the dragged card currently lives, so the drop can move it
  source?: { slotId: string; gridId: string; cellIndex: number };
}

export interface KnowGraphMetadata {
  title?: string;
  description?: string;
  createdBy?: string;
  version?: number;
  updatedAt?: string;
  category?: string;
  metaArea?: string;
  graphType?: string | null;
  seoSlug?: string;
  publicationState?: string;
  publishedAt?: string | null;
  isThemeGraph?: boolean;
}

export interface KnowGraphSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  nodeTypes?: string[];
  nodeLabelsText?: string;
  portfolioImagePath?: string | null;
  searchText?: string;
  metadata?: KnowGraphMetadata;
}

export interface KnowGraphNode {
  id: string;
  label: string;
  info?: string;
  type?: string;
  superadminOnly?: boolean;
  updatedAt?: string;
  color?: string;
  x?: number;
  y?: number;
  visible?: boolean;
  order?: number;
  [key: string]: any;
}

export interface KnowGraphEdge {
  id?: string;
  source?: string;
  from?: string;
  target?: string;
  to?: string;
  label?: string;
  relationship?: string;
  [key: string]: any;
}

export interface KnowGraphDetail {
  id: string;
  title: string;
  nodes: KnowGraphNode[];
  edges?: KnowGraphEdge[];
  metadata?: KnowGraphMetadata;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface MetaAreaItem {
  name: string;
  count: number;
}

