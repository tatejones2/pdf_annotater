import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileUp,
  HelpCircle,
  Menu,
  PanelLeftClose,
  Redo2,
  RotateCcw,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { PDFDocumentProxy, PDFPageProxy } from '../../lib/pdfjs';
import { APP_CONFIG } from '../../app/config';
import { useEditorStore } from '../../stores/useEditorStore';
import { Logo } from '../common/Logo';
import { Toolbar } from './Toolbar';
import { PropertiesBar } from './PropertiesBar';
import { PageView } from './PageView';
import { Thumbnail } from './Thumbnail';
import { AnnotationSidebar } from '../sidebars/AnnotationSidebar';
import { exportAnnotatedPdf } from '../../lib/pdf';
import { projectSchema } from '../../types/annotations';

type Props = {
  document: PDFDocumentProxy;
  bytes: Uint8Array;
  fileName: string;
  initialZoom?: number;
  initialPage?: number;
  onClose: () => void;
  onViewChange: (zoom: number, page: number) => void;
};

const download = (data: BlobPart, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = globalThis.document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function Editor({ document, bytes, fileName, initialZoom = 1, initialPage = 1, onClose, onViewChange }: Props) {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [zoom, setZoom] = useState(initialZoom);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const annotations = useEditorStore((state) => state.annotations);
  const dirty = useEditorStore((state) => state.dirty);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const load = useEditorStore((state) => state.load);
  const selectedId = useEditorStore((state) => state.selectedId);
  const remove = useEditorStore((state) => state.remove);
  const setTool = useEditorStore((state) => state.setTool);

  useEffect(() => {
    void Promise.all(Array.from({ length: document.numPages }, (_, index) => document.getPage(index + 1))).then(setPages);
  }, [document]);

  useEffect(() => onViewChange(zoom, currentPage), [currentPage, onViewChange, zoom]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (modifier && event.key === '+') setZoom((value) => Math.min(2.5, value + 0.15));
      else if (modifier && event.key === '-') setZoom((value) => Math.max(0.45, value - 0.15));
      else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) remove(selectedId);
      else if (event.key === 'Escape') setTool('select');
      else if (event.key.toLowerCase() === 'v') setTool('select');
      else if (event.key === '1') setTool('highlight');
      else if (event.key === '2') setTool('underline');
      else if (event.key.toLowerCase() === 't') setTool('text');
      else if (event.key.toLowerCase() === 'n') setTool('sticky-note');
      else if (event.key.toLowerCase() === 'p') setTool('pen');
      else if (event.key.toLowerCase() === 's') setTool('rectangle');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [redo, remove, selectedId, setTool, undo]);

  const goTo = (page: number) => {
    const safe = Math.max(1, Math.min(document.numPages, page));
    setCurrentPage(safe);
    globalThis.document.querySelector(`[aria-label="Page ${safe}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const result = await exportAnnotatedPdf(bytes, annotations);
      download(result, `${fileName.replace(/\.pdf$/i, '')}-annotated.pdf`, 'application/pdf');
      setToast('Annotated PDF exported');
    } catch {
      setToast('Export failed. Your work is still safe.');
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const saveProject = () => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    download(
      JSON.stringify({
        schemaVersion: APP_CONFIG.schemaVersion,
        name: fileName.replace(/\.pdf$/i, ''),
        originalFileName: fileName,
        pdfByteLength: bytes.byteLength,
        annotations,
        viewState: { zoom, currentPage },
        pdfBase64: btoa(binary),
      }, null, 2),
      `${fileName.replace(/\.pdf$/i, '')}.paperwood.json`,
      'application/json',
    );
    setToast('Project file saved');
  };

  const importProject = async (file: File) => {
    try {
      const parsed = projectSchema.parse(JSON.parse(await file.text()));
      load(parsed.annotations);
      setZoom(parsed.viewState.zoom);
      goTo(parsed.viewState.currentPage);
      setToast('Annotations imported');
    } catch {
      setToast('That project file is invalid or unsupported.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={`editor-shell ${leftOpen ? '' : 'left-closed'} ${rightOpen ? '' : 'right-closed'}`}>
      <header className="topbar">
        <Logo compact />
        <button className="sidebar-toggle" onClick={() => setLeftOpen((value) => !value)} aria-label="Toggle thumbnails"><PanelLeftClose size={18} /></button>
        <div className="file-meta" title={fileName}><strong>{fileName}</strong><span>{document.numPages} pages · {(bytes.byteLength / 1024 / 1024).toFixed(1)} MB</span></div>
        <div className="save-status" aria-live="polite"><span className={dirty ? 'saving' : ''} />{dirty ? 'Saving…' : 'Saved locally'}</div>
        <div className="topbar-actions">
          <button className="icon-button" disabled={!past.length} onClick={undo} aria-label="Undo"><Undo2 size={18} /></button>
          <button className="icon-button" disabled={!future.length} onClick={redo} aria-label="Redo"><Redo2 size={18} /></button>
          <button className="export-button" onClick={exportPdf} disabled={exporting}><Download size={17} />{exporting ? 'Exporting…' : 'Export PDF'}</button>
          <div className="menu-wrap">
            <button className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="More actions"><Menu size={19} /></button>
            {menuOpen && (
              <div className="overflow-menu">
                <button onClick={saveProject}><FileDown size={16} /> Save project</button>
                <button onClick={() => fileInput.current?.click()}><FileUp size={16} /> Load project</button>
                <button onClick={() => { setHelpOpen(true); setMenuOpen(false); }}><HelpCircle size={16} /> Shortcuts</button>
                <button onClick={onClose}><X size={16} /> Close document</button>
              </div>
            )}
          </div>
          <input ref={fileInput} hidden type="file" accept=".json,.paperwood.json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importProject(file);
          }} />
        </div>
      </header>

      {leftOpen && <aside className="thumbnail-sidebar"><span className="sidebar-title">Pages</span>{pages.map((page, index) => <Thumbnail key={index} page={page} index={index} active={currentPage === index + 1} onClick={() => goTo(index + 1)} />)}</aside>}
      <Toolbar />
      <PropertiesBar />
      <main className="workspace">
        <div className="pages">
          {pages.map((page, index) => <PageView key={index} page={page} pageIndex={index} zoom={zoom} onVisible={setCurrentPage} />)}
        </div>
      </main>
      {rightOpen && <AnnotationSidebar onNavigate={goTo} />}
      <button className="right-toggle" onClick={() => setRightOpen((value) => !value)} aria-label="Toggle annotation sidebar"><ChevronLeft size={17} /></button>
      <div className="page-controls">
        <button onClick={() => goTo(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
        <label><input value={currentPage} onChange={(e) => goTo(Number(e.target.value))} aria-label="Current page" /> <span>/ {document.numPages}</span></label>
        <button onClick={() => goTo(currentPage + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
        <i />
        <button onClick={() => setZoom((value) => Math.max(0.45, value - 0.15))} aria-label="Zoom out"><ZoomOut size={17} /></button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((value) => Math.min(2.5, value + 0.15))} aria-label="Zoom in"><ZoomIn size={17} /></button>
        <button onClick={() => setZoom(1)} aria-label="Reset zoom"><RotateCcw size={15} /></button>
        <button className="fit-button" onClick={() => setZoom(0.82)}>Fit <ChevronDown size={13} /></button>
      </div>

      {helpOpen && (
        <div className="modal-backdrop" onMouseDown={() => setHelpOpen(false)}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="eyebrow">Quick reference</span><h2 id="help-title">Keyboard shortcuts</h2></div><button className="icon-button" onClick={() => setHelpOpen(false)} aria-label="Close shortcuts"><X /></button></header>
            <div className="shortcut-grid">
              {[
                ['Select', 'V'], ['Highlight', '1'], ['Underline', '2'], ['Text', 'T'], ['Sticky note', 'N'],
                ['Pen', 'P'], ['Shape', 'S'], ['Undo', '⌘ Z'], ['Redo', '⌘ ⇧ Z'], ['Delete', '⌫'],
              ].map(([label, key]) => <div key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
            </div>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
