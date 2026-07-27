import {
  ArrowUpRight,
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  PenLine,
  RectangleHorizontal,
  StickyNote,
  TextCursorInput,
  Underline,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tool } from '../../types/annotations';
import { useEditorStore } from '../../stores/useEditorStore';

const tools: Array<{ id: Tool; label: string; icon: LucideIcon }> = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'underline', label: 'Underline', icon: Underline },
  { id: 'text', label: 'Text', icon: TextCursorInput },
  { id: 'sticky-note', label: 'Note', icon: StickyNote },
  { id: 'pen', label: 'Pen', icon: PenLine },
  { id: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
];

export function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool);
  const setTool = useEditorStore((state) => state.setTool);
  const selectedId = useEditorStore((state) => state.selectedId);
  const remove = useEditorStore((state) => state.remove);

  return (
    <nav className="editor-toolbar" aria-label="Annotation tools">
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={activeTool === id ? 'active' : ''}
          aria-pressed={activeTool === id}
          title={label}
          onClick={() => setTool(id)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
      <div className="toolbar-divider" />
      <button
        disabled={!selectedId}
        title="Delete selected"
        onClick={() => selectedId && remove(selectedId)}
      >
        <Eraser size={19} /><span>Delete</span>
      </button>
    </nav>
  );
}
