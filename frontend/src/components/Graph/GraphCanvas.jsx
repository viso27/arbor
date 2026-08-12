import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls, MiniMap, Background,
  useNodesState, useEdgesState,
  addEdge, BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import NoteNode from './NoteNode';

const nodeTypes = { noteNode: NoteNode };

export default function GraphCanvas({ nodes: rawNodes, edges: rawEdges, activeNoteId, onNodeClick }) {
  const nodes = useMemo(() => rawNodes.map((n, i) => ({
    id:       n.id,
    type:     'noteNode',
    position: { x: (i % 4) * 220 + 50, y: Math.floor(i / 4) * 160 + 50 },
    data:     { title: n.title, preview: n.preview, active: n.id === activeNoteId },
  })), [rawNodes, activeNoteId]);

  const edges = useMemo(() => rawEdges.map(e => ({
    id:           e.id,
    source:       e.from_note_id,
    target:       e.to_note_id,
    label:        `${Math.round(e.similarity * 100)}%`,
    animated:     true,
    style:        { stroke: '#58a6ff', strokeWidth: 1.5 },
    labelStyle:   { fill: '#7d8590', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#161b22', fillOpacity: 0.8 },
  })), [rawEdges]);

  const handleNodeClick = useCallback((_, node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0d1117' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Controls style={{ background: '#161b22', border: '1px solid #30363d' }} />
        <MiniMap
          style={{ background: '#161b22', border: '1px solid #30363d' }}
          nodeColor="#30363d"
          maskColor="rgba(0,0,0,0.5)"
        />
        <Background variant={BackgroundVariant.Dots} color="#21262d" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
