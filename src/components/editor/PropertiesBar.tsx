import { useEditorStore } from '../../stores/useEditorStore';

const colors = ['#c86b3c', '#d0a43c', '#2f6f68', '#a94b43', '#25231f'];

export function PropertiesBar() {
  const tool = useEditorStore((state) => state.activeTool);
  const color = useEditorStore((state) => state.color);
  const opacity = useEditorStore((state) => state.opacity);
  const strokeWidth = useEditorStore((state) => state.strokeWidth);
  const setStyle = useEditorStore((state) => state.setStyle);

  if (tool === 'select') return null;
  return (
    <div className="properties-bar" aria-label={`${tool} properties`}>
      <strong>{tool.replace('-', ' ')}</strong>
      <span className="property-label">Color</span>
      <div className="swatches">
        {colors.map((value) => (
          <button
            key={value}
            aria-label={`Use ${value}`}
            aria-pressed={color === value}
            className={color === value ? 'selected' : ''}
            style={{ backgroundColor: value }}
            onClick={() => setStyle({ color: value, fillColor: value })}
          />
        ))}
      </div>
      <label>
        <span>Opacity</span>
        <input
          type="range"
          min="0.15"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(event) => setStyle({ opacity: Number(event.target.value) })}
        />
      </label>
      {(tool === 'pen' || ['rectangle', 'ellipse', 'line', 'arrow', 'underline'].includes(tool)) && (
        <label>
          <span>Width</span>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(event) => setStyle({ strokeWidth: Number(event.target.value) })}
          />
        </label>
      )}
    </div>
  );
}
