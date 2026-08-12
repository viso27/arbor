import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export default function NoteEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange({
        html:  editor.getHTML(),
        text:  editor.getText(),
      });
    },
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 200px; color: #e6edf3; font-size: 14px; line-height: 1.7; font-family: inherit;',
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div style={s.wrap}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        {[
          { label: 'B',  action: () => editor.chain().focus().toggleBold().run(),   active: editor.isActive('bold') },
          { label: 'I',  action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
          { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
          { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { label: '• List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
          { label: '1. List', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
          { label: '< >', action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code') },
        ].map(btn => (
          <button key={btn.label} style={{ ...s.tbBtn, ...(btn.active ? s.tbActive : {}) }}
            onClick={btn.action} type="button">
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} style={s.editor} />
    </div>
  );
}

const s = {
  wrap:     { border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden', background: '#0d1117' },
  toolbar:  { display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #21262d', flexWrap: 'wrap' },
  tbBtn:    { background: 'none', border: '1px solid #30363d', borderRadius: 4, color: '#7d8590', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '3px 8px' },
  tbActive: { background: 'rgba(88,166,255,0.15)', borderColor: '#58a6ff', color: '#58a6ff' },
  editor:   { padding: '14px 16px', minHeight: 200 },
};
