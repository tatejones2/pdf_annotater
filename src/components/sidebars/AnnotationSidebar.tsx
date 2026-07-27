import { Copy, Layers, Lock, Search, Trash2, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';

export function AnnotationSidebar({ onNavigate }: { onNavigate: (page: number) => void }) {
  const [filter, setFilter] = useState('');
  const annotations = useEditorStore((state) => state.annotations);
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);
  const update = useEditorStore((state) => state.update);
  const duplicate = useEditorStore((state) => state.duplicate);
  const remove = useEditorStore((state) => state.remove);
  const visible = useMemo(
    () => annotations.filter((item) => item.type.includes(filter.toLowerCase()) || item.text?.toLowerCase().includes(filter.toLowerCase())),
    [annotations, filter],
  );
  const selected = annotations.find((item) => item.id === selectedId);

  return (
    <aside className="right-sidebar">
      <header><div><span className="eyebrow">Document</span><h2>Annotations</h2></div><span className="count-badge">{annotations.length}</span></header>
      <label className="search-field"><Search size={15} /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter notes…" /></label>
      <div className="annotation-list">
        {visible.length === 0 ? (
          <div className="empty-annotations"><Layers size={28} /><strong>No annotations yet</strong><p>Choose a tool, then click or draw on a page.</p></div>
        ) : visible.map((item) => (
          <button
            key={item.id}
            className={selectedId === item.id ? 'selected' : ''}
            onClick={() => { select(item.id); onNavigate(item.pageIndex + 1); }}
          >
            <span className="annotation-color" style={{ background: item.color }} />
            <span><strong>{item.type.replace('-', ' ')}</strong><small>Page {item.pageIndex + 1}{item.text ? ` · ${item.text.slice(0, 28)}` : ''}</small></span>
            {item.locked && <Lock size={13} />}
          </button>
        ))}
      </div>
      {selected && (
        <section className="selection-actions">
          <h3>Selected annotation</h3>
          <div>
            <button onClick={duplicate}><Copy size={15} /> Duplicate</button>
            <button onClick={() => update(selected.id, { locked: !selected.locked })}>
              {selected.locked ? <Unlock size={15} /> : <Lock size={15} />} {selected.locked ? 'Unlock' : 'Lock'}
            </button>
            <button className="danger" onClick={() => remove(selected.id)}><Trash2 size={15} /> Delete</button>
          </div>
        </section>
      )}
      <footer><span className="status-dot" /> Saved locally</footer>
    </aside>
  );
}
