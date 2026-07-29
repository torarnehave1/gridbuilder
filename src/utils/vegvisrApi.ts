import { KnowGraphNode, KnowGraphEdge, SlotData, NodeItem, Theme } from '../types';
import { ensureUUID, isValidUUID } from './uuidUtils';
import { vegvisrFetch } from './vegvisrClient';

export interface PatchNodeParams {
  graphId: string;
  nodeId: string;
  info: string;
  label?: string;
  expectedVersion?: number;
  allSlots?: SlotData[];
  allNodes?: NodeItem[];
  activeGraphTitle?: string;
}

/**
 * Updates a specific node in a Vegvisr Knowledge Graph using the patchNode endpoint.
 * If the node does not exist in the graph yet, uses the addNode endpoint to attach it directly
 * to the current active graph without duplicating or overwriting the graph.
 */
export async function patchVegvisrNode(params: PatchNodeParams): Promise<{
  ok: boolean;
  graphId?: string;
  newVersion?: number;
  message?: string;
}> {
  let targetGraphId = params.graphId;
  let versionToUse = params.expectedVersion;

  // If expectedVersion is not provided, fetch current graph metadata
  if (versionToUse === undefined || versionToUse === null) {
    try {
      const graphRes = await vegvisrFetch(
        `/getknowgraph?id=${encodeURIComponent(targetGraphId)}`
      );
      const graphData = await graphRes.json();
      if (
        graphData &&
        graphData.metadata &&
        typeof graphData.metadata.version === 'number'
      ) {
        versionToUse = graphData.metadata.version;
      } else if (typeof graphData?.version === 'number') {
        versionToUse = graphData.version;
      } else {
        versionToUse = 0;
      }
    } catch (e) {
      console.warn('Could not fetch graph version before patchNode, defaulting to 0:', e);
      versionToUse = 0;
    }
  }

  // 1. First Attempt: Try patching the existing node via /patchNode
  const patchPayload = {
    graphId: targetGraphId,
    nodeId: params.nodeId,
    expectedVersion: versionToUse,
    fields: {
      info: params.info,
      ...(params.label ? { label: params.label } : {}),
    },
  };

  try {
    const patchResponse = await vegvisrFetch('/patchNode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchPayload),
    });

    const patchData = await patchResponse.json().catch(() => ({}));

    if (patchResponse.ok && patchData.ok !== false) {
      return {
        ok: true,
        graphId: targetGraphId,
        newVersion: patchData.newVersion,
        message: patchData.message || 'Node patched successfully in Vegvisr',
      };
    }

    console.warn('patchNode response:', patchData);
  } catch (err: any) {
    console.warn('patchNode exception:', err);
  }

  // 2. Second Attempt: If node doesn't exist in current graph, use /addNode
  const addPayload = {
    graphId: targetGraphId,
    expectedVersion: versionToUse,
    node: {
      id: params.nodeId,
      label: params.label || params.nodeId,
      type: 'fulltext',
      info: params.info,
      visible: true,
    },
  };

  try {
    const addResponse = await vegvisrFetch('/addNode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addPayload),
    });

    const addData = await addResponse.json().catch(() => ({}));

    if (addResponse.ok && addData.ok !== false) {
      return {
        ok: true,
        graphId: targetGraphId,
        newVersion: addData.newVersion,
        message: addData.message || 'Node added successfully to Vegvisr graph',
      };
    }

    // Handle version mismatch on addNode by refetching latest version and retrying once
    const addErrMsg = (addData.error || addData.message || '').toString().toLowerCase();
    if (addErrMsg.includes('version')) {
      try {
        const freshRes = await vegvisrFetch(
          `/getknowgraph?id=${encodeURIComponent(targetGraphId)}`
        );
        const freshData = await freshRes.json();
        const freshVersion =
          freshData?.metadata?.version ?? freshData?.version ?? (versionToUse || 0) + 1;

        addPayload.expectedVersion = freshVersion;

        const retryAddResponse = await vegvisrFetch('/addNode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addPayload),
        });

        const retryAddData = await retryAddResponse.json().catch(() => ({}));
        if (retryAddResponse.ok && retryAddData.ok !== false) {
          return {
            ok: true,
            graphId: targetGraphId,
            newVersion: retryAddData.newVersion,
            message: retryAddData.message || 'Node added to Vegvisr graph after version refresh',
          };
        }
      } catch (retryErr) {
        console.warn('Retry addNode exception:', retryErr);
      }
    }

    console.warn('addNode failed:', addData);
  } catch (err: any) {
    console.warn('addNode exception:', err);
  }

  // 3. DO NOT auto-create or auto-save a new graph on fallback.
  // Graph creation and full graph saves must ONLY be triggered by explicit user action ("Save Graph" or "Save Changes").
  return {
    ok: false,
    graphId: targetGraphId,
    message: 'Node patch/add failed in active graph. No auto-graph was created.',
  };
}

export interface SaveGraphParams {
  id?: string;
  title: string;
  description?: string;
  createdBy?: string;
  version?: number;
  slots: SlotData[];
  nodes: NodeItem[];
  activeTheme?: Theme;
  override?: boolean;
}

/**
 * Saves the current HTML editor layout into a Vegvisr Knowledge Graph using saveGraphWithHistory
 * where each grid block is converted into a graph node.
 */
export async function saveGraphWithHistory(params: SaveGraphParams): Promise<{
  id: string;
  newVersion?: number;
  message?: string;
}> {
  // Graph ID must strictly be a UUID. If params.id is a valid UUID, reuse it; otherwise generate a new UUID.
  const graphId = ensureUUID(params.id);

  const graphNodes: KnowGraphNode[] = [];
  const graphEdges: KnowGraphEdge[] = [];
  const processedNodeIds = new Set<string>();

  params.slots.forEach((slot, sIdx) => {
    slot.grids.forEach((grid, gIdx) => {
      grid.cells.forEach((cell, cIdx) => {
        // Skip empty grid cells without a nodeId or custom content
        if (!cell.nodeId && !cell.customMarkdown?.trim()) {
          return;
        }

        const nodeKey = cell.sourceNodeId || cell.nodeId || cell.id;

        const libraryNode = params.nodes.find(
          (n) => n.id === cell.nodeId || n.sourceNodeId === cell.sourceNodeId || n.id === nodeKey
        );

        const content = cell.customMarkdown ?? libraryNode?.info ?? '';

        let label = libraryNode?.label;
        if (!label) {
          const headingMatch = content.match(/^#+\s*(?:🎬\s*)?(.*)$/m);
          if (headingMatch && headingMatch[1] && headingMatch[1].trim()) {
            label = headingMatch[1].trim();
          } else {
            label = `${slot.title} - Cell ${cIdx + 1}`;
          }
        }

        let finalNodeId = nodeKey;
        if (processedNodeIds.has(finalNodeId)) {
          finalNodeId = `node-${slot.id}-${grid.id}-${cell.id}`;
        }
        processedNodeIds.add(finalNodeId);

        graphNodes.push({
          id: finalNodeId,
          label: label,
          type: (libraryNode as any)?.type || 'fulltext',
          info: content,
          color: params.activeTheme?.vars['--accent'] || '#4f6d7a',
          position: { x: sIdx * 340, y: gIdx * 220 + cIdx * 120 },
          visible: true,
          metadata: {
            slotId: slot.id,
            slotTitle: slot.title,
            gridId: grid.id,
            gridSize: grid.size,
            gridCols: grid.cols,
            cellAlign: cell.align,
            ...(libraryNode as any)?.metadata,
          },
        });
      });
    });
  });

  // Note: Only nodes actually placed in slot grid cells are saved to the graph to maintain SSOT integrity.

  // Create graph edges connecting sequential nodes within each slot
  for (let i = 0; i < graphNodes.length - 1; i++) {
    const curr = graphNodes[i];
    const next = graphNodes[i + 1];
    if (
      curr.metadata?.slotId &&
      next.metadata?.slotId &&
      curr.metadata.slotId === next.metadata.slotId
    ) {
      graphEdges.push({
        id: `edge-${curr.id}-${next.id}`,
        source: curr.id,
        target: next.id,
        label: 'next_in_slot',
      });
    }
  }

  const payload = {
    id: graphId,
    override: params.override ?? true,
    graphData: {
      metadata: {
        title: params.title || 'HyperBuilder Knowledge Graph',
        description:
          params.description ||
          'Exported Knowledge Graph layout from HyperBuilder HTML editor studio',
        createdBy: params.createdBy || 'torarnehave@gmail.com',
        version: params.version ?? 0,
        updatedAt: new Date().toISOString(),
      },
      nodes: graphNodes,
      edges: graphEdges,
    },
  };

  const response = await vegvisrFetch('/saveGraphWithHistory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || (data.status && data.status >= 400)) {
    throw new Error(
      data.error ||
        data.message ||
        `Failed to save graph with history (${response.status})`
    );
  }

  return {
    id: data.id || graphId,
    newVersion: data.newVersion,
    message: data.message || 'Graph with history saved successfully to Vegvisr',
  };
}
