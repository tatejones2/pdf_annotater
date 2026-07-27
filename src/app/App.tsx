import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocument, type PDFDocumentProxy } from '../lib/pdfjs';
import { Welcome } from '../components/welcome/Welcome';
import { Editor } from '../components/editor/Editor';
import { APP_CONFIG } from './config';
import { clearRecentProject, getRecentProject, saveRecentProject, type SavedProject } from '../lib/persistence';
import { useEditorStore } from '../stores/useEditorStore';

type ActiveDocument = {
  fileName: string;
  bytes: Uint8Array;
  pdf: PDFDocumentProxy;
  zoom?: number;
  currentPage?: number;
};

export default function App() {
  const [active, setActive] = useState<ActiveDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<SavedProject | undefined>();
  const viewRef = useRef({ zoom: 1, currentPage: 1 });
  const annotations = useEditorStore((state) => state.annotations);
  const dirty = useEditorStore((state) => state.dirty);
  const loadAnnotations = useEditorStore((state) => state.load);
  const markSaved = useEditorStore((state) => state.markSaved);
  const clear = useEditorStore((state) => state.clear);

  useEffect(() => { void getRecentProject().then(setRecent).catch(() => undefined); }, []);

  const loadBytes = useCallback(async (bytes: Uint8Array, fileName: string, saved?: SavedProject) => {
    setLoading(true);
    setError(null);
    try {
      const task = getDocument({ data: bytes.slice() });
      const pdf = await task.promise;
      if (saved) loadAnnotations(saved.annotations);
      else clear();
      setActive({ fileName, bytes, pdf, zoom: saved?.zoom, currentPage: saved?.currentPage });
    } catch (reason) {
      const message = reason instanceof Error && /password/i.test(reason.message)
        ? 'This PDF is password protected. Please unlock it before opening.'
        : 'We couldn’t read this PDF. It may be damaged or use an unsupported format.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clear, loadAnnotations]);

  const openFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > APP_CONFIG.maxRecommendedFileSize) {
      setError('This file is over the recommended 50 MB limit. Choose a smaller PDF for best performance.');
      return;
    }
    await loadBytes(new Uint8Array(await file.arrayBuffer()), file.name);
  };

  useEffect(() => {
    if (!active || !dirty) return;
    const timer = window.setTimeout(() => {
      void saveRecentProject({
        id: 'recent',
        fileName: active.fileName,
        bytes: active.bytes.slice().buffer,
        annotations,
        zoom: viewRef.current.zoom,
        currentPage: viewRef.current.currentPage,
        updatedAt: Date.now(),
      }).then(() => {
        markSaved();
        void getRecentProject().then(setRecent);
      }).catch(() => setError('Local saving is unavailable. Export a project file to keep your work.'));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [active, annotations, dirty, markSaved]);

  const close = () => {
    if (dirty && !window.confirm('Close this document? Your latest changes may still be saving.')) return;
    void active?.pdf.cleanup();
    setActive(null);
    clear();
  };

  if (loading) return <main className="loading-screen"><div className="loading-mark" /><strong>Opening your document…</strong><span>Everything is staying on this device.</span></main>;
  if (!active) return (
    <Welcome
      onOpen={(file) => void openFile(file)}
      error={error}
      recentName={recent?.fileName}
      onRestore={recent ? () => void loadBytes(new Uint8Array(recent.bytes), recent.fileName, recent) : undefined}
      onDismissRecent={() => { void clearRecentProject(); setRecent(undefined); }}
    />
  );

  return (
    <Editor
      document={active.pdf}
      bytes={active.bytes}
      fileName={active.fileName}
      initialZoom={active.zoom}
      initialPage={active.currentPage}
      onClose={close}
      onViewChange={(zoom, currentPage) => { viewRef.current = { zoom, currentPage }; }}
    />
  );
}
