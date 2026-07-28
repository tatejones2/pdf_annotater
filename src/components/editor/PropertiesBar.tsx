import { useMemo } from 'react';
import { Bold, Italic, Underline as UnderlineIcon } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';

const colors = ['#c86b3c', '#d0a43c', '#2f6f68', '#a94b43', '#25231f'];

export function PropertiesBar() {
  const tool = useEditorStore((state) => state.activeTool);
  const color = useEditorStore((state) => state.color);
  const opacity = useEditorStore((state) => state.opacity);
  const strokeWidth = useEditorStore((state) => state.strokeWidth);
  const textFont = useEditorStore((state) => state.textFont);
  const textBold = useEditorStore((state) => state.textBold);
  const textItalic = useEditorStore((state) => state.textItalic);
  const textUnderline = useEditorStore((state) => state.textUnderline);
  const annotations = useEditorStore((state) => state.annotations);
  const selectedId = useEditorStore((state) => state.selectedId);
  const setStyle = useEditorStore((state) => state.setStyle);
  const update = useEditorStore((state) => state.update);
  const selected = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedId),
    [annotations, selectedId],
  );
  const selectedText = tool === 'select' && selected?.type === 'text' ? selected : null;
  const propertyTool = selectedText ? 'text' : tool;
  const activeTextFont = selectedText?.fontFamily ?? textFont;
  const isBold = selectedText?.bold ?? textBold;
  const isItalic = selectedText?.italic ?? textItalic;
  const isUnderlined = selectedText?.underlineText ?? textUnderline;

  if (tool === 'select' && !selectedText) return null;

  const setTextFormatting = (
    field: 'bold' | 'italic' | 'underlineText',
    value: boolean,
  ) => {
    if (selectedText) update(selectedText.id, { [field]: value });
    else if (field === 'bold') setStyle({ textBold: value });
    else if (field === 'italic') setStyle({ textItalic: value });
    else setStyle({ textUnderline: value });
  };

  const setTextFont = (fontFamily: 'sans' | 'signature') => {
    if (selectedText) {
      update(selectedText.id, {
        fontFamily,
        fontSize: fontFamily === 'signature' ? 20 : 14,
      });
    } else {
      setStyle({ textFont: fontFamily });
    }
  };

  return (
    <div className="properties-bar" aria-label={`${propertyTool} properties`}>
      <strong>{propertyTool.replace('-', ' ')}</strong>
      <span className="property-label">Color</span>
      <div className="swatches">
        {colors.map((value) => (
          <button
            key={value}
            aria-label={`Use ${value}`}
            aria-pressed={(selectedText?.color ?? color) === value}
            className={(selectedText?.color ?? color) === value ? 'selected' : ''}
            style={{ backgroundColor: value }}
            onClick={() => {
              if (selectedText) update(selectedText.id, { color: value });
              else setStyle({ color: value, fillColor: value });
            }}
          />
        ))}
      </div>
      {propertyTool === 'text' && (
        <div className="font-style-control" aria-label="Text style">
          <span className="property-label">Style</span>
          <button
            className={activeTextFont === 'sans' ? 'active' : ''}
            aria-pressed={activeTextFont === 'sans'}
            onClick={() => setTextFont('sans')}
          >
            Clean
          </button>
          <button
            className={`signature-option ${activeTextFont === 'signature' ? 'active' : ''}`}
            aria-pressed={activeTextFont === 'signature'}
            onClick={() => setTextFont('signature')}
          >
            Signature
          </button>
        </div>
      )}
      {propertyTool === 'text' && (
        <div className="text-format-control" aria-label="Text formatting">
          <span className="property-label">Format</span>
          <button
            aria-label="Bold text"
            aria-pressed={isBold}
            className={isBold ? 'active' : ''}
            onClick={() => setTextFormatting('bold', !isBold)}
          >
            <Bold size={15} />
          </button>
          <button
            aria-label="Italic text"
            aria-pressed={isItalic}
            className={isItalic ? 'active' : ''}
            onClick={() => setTextFormatting('italic', !isItalic)}
          >
            <Italic size={15} />
          </button>
          <button
            aria-label="Underline text"
            aria-pressed={isUnderlined}
            className={isUnderlined ? 'active' : ''}
            onClick={() => setTextFormatting('underlineText', !isUnderlined)}
          >
            <UnderlineIcon size={15} />
          </button>
        </div>
      )}
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
      {(propertyTool === 'pen' || ['rectangle', 'ellipse', 'line', 'arrow', 'underline'].includes(propertyTool)) && (
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
