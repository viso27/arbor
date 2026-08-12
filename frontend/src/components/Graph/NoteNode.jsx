import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function NoteNode({ data, selected }) {
  return (
    <div style={{
      ...s.node,
      ...(selected ? s.selected : {}),
      ...(data.active ? s.active : {}),
    }}>
      <Handle type="target" position={Position.Top} style={s.handle} />
      <div style={s.icon}>📝</div>
      <div style={s.title}>{data.title?.slice(0, 30)}{data.title?.length > 30 ? '…' : ''}</div>
      <div style={s.preview}>{data.preview?.slice(0, 50)}{data.preview?.length > 50 ? '…' : ''}</div>
      <Handle type="source" position={Position.Bottom} style={s.handle} />
    </div>
  );
}

const s = {
  node:     { background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 14px', minWidth: 160, maxWidth: 200, cursor: 'pointer', transition: 'all 0.2s' },
  selected: { border: '1px solid #58a6ff', boxShadow: '0 0 0 3px rgba(88,166,255,0.15)' },
  active:   { border: '1px solid #3fb950', boxShadow: '0 0 0 3px rgba(63,185,80,0.15)' },
  icon:     { fontSize: 16, marginBottom: 6 },
  title:    { fontSize: 12, fontWeight: 700, color: '#e6edf3', marginBottom: 4, lineHeight: 1.3 },
  preview:  { fontSize: 11, color: '#7d8590', lineHeight: 1.4 },
  handle:   { background: '#30363d', border: '2px solid #58a6ff', width: 8, height: 8 },
};

export default memo(NoteNode);
