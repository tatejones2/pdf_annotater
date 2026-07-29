import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Download,
  FileText,
  LockKeyhole,
  Upload,
} from 'lucide-react';
import { APP_CONFIG } from '../../app/config';
import { getDocument, type PDFDocumentProxy } from '../../lib/pdfjs';
import { transferPdfPage, type PageTransferMode } from '../../lib/pageOrganizer';
import { Logo } from '../common/Logo';

type LoadedPdf = {
  file: File;
  bytes: Uint8Array;
  document: PDFDocumentProxy;
};

type Props = {
  onClose: () => void;
};

type PickerProps = {
  label: string;
  description: string;
  pdf: LoadedPdf | null;
  page: number;
  onPageChange: (page: number) => void;
  onFile: (file: File) => void;
};

function PagePreview({ document, page }: { document: PDFDocumentProxy; page: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | null>(null);

  useEffect(() => {
    let disposed = false;
    const render = async () => {
      const previousTask = renderTaskRef.current;
      if (previousTask) {
        previousTask.cancel();
        try {
          await previousTask.promise;
        } catch {
          // Cancellation is expected when switching preview pages.
        }
      }
      if (disposed) return;
      const pdfPage = await document.getPage(page);
      if (disposed || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(1, 220 / base.width, 280 / base.height);
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) return;
      const renderParameters = { canvas, canvasContext: context, viewport };
      const task = pdfPage.render(
        renderParameters as Parameters<typeof pdfPage.render>[0],
      );
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (reason) {
        if (!(reason instanceof Error && reason.name === 'RenderingCancelledException')) {
          throw reason;
        }
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
      }
    };
    void render().catch(() => undefined);

    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
    };
  }, [document, page]);

  return <canvas ref={canvasRef} aria-label={`Preview of page ${page}`} />;
}

function PdfPicker({
  label,
  description,
  pdf,
  page,
  onPageChange,
  onFile,
}: PickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="organizer-document-card">
      <div className="organizer-document-heading">
        <span className="organizer-step">{label}</span>
        <div>
          <h2>{pdf?.file.name ?? description}</h2>
          {pdf && (
            <p>{pdf.document.numPages} pages · {(pdf.file.size / 1024 / 1024).toFixed(1)} MB</p>
          )}
        </div>
      </div>

      {pdf ? (
        <>
          <div className="organizer-preview">
            <PagePreview document={pdf.document} page={page} />
          </div>
          <label className="page-number-field">
            <span>Page to use</span>
            <div>
              <input
                type="number"
                min="1"
                max={pdf.document.numPages}
                value={page}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isInteger(next)) {
                    onPageChange(Math.max(1, Math.min(pdf.document.numPages, next)));
                  }
                }}
              />
              <span>of {pdf.document.numPages}</span>
            </div>
          </label>
          <button className="secondary-button" onClick={() => inputRef.current?.click()}>
            Choose a different PDF
          </button>
        </>
      ) : (
        <button className="organizer-upload" onClick={() => inputRef.current?.click()}>
          <span><Upload size={24} /></span>
          <strong>Choose PDF</strong>
          <small>PDF · Recommended max 50 MB</small>
        </button>
      )}

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </section>
  );
}

const download = (data: BlobPart, name: string) => {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const anchor = globalThis.document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function PageOrganizer({ onClose }: Props) {
  const [source, setSource] = useState<LoadedPdf | null>(null);
  const [destination, setDestination] = useState<LoadedPdf | null>(null);
  const sourceRef = useRef<LoadedPdf | null>(null);
  const destinationRef = useRef<LoadedPdf | null>(null);
  const [sourcePage, setSourcePage] = useState(1);
  const [destinationPage, setDestinationPage] = useState(1);
  const [mode, setMode] = useState<PageTransferMode>('replace');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  sourceRef.current = source;
  destinationRef.current = destination;

  useEffect(() => () => {
    void sourceRef.current?.document.cleanup();
    void destinationRef.current?.document.cleanup();
  }, []);

  const loadPdf = async (file: File, slot: 'source' | 'destination') => {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > APP_CONFIG.maxRecommendedFileSize) {
      setError('This PDF is over the recommended 50 MB limit.');
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const document = await getDocument({ data: bytes.slice() }).promise;
      const loaded = { file, bytes, document };
      if (slot === 'source') {
        void source?.document.cleanup();
        setSource(loaded);
        setSourcePage(1);
      } else {
        void destination?.document.cleanup();
        setDestination(loaded);
        setDestinationPage(1);
      }
    } catch (reason) {
      setError(
        reason instanceof Error && /password/i.test(reason.message)
          ? 'This PDF is password protected. Unlock it before organizing its pages.'
          : 'We couldn’t read that PDF. It may be damaged or unsupported.',
      );
    }
  };

  const createPdf = async () => {
    if (!source || !destination) return;
    setWorking(true);
    setError(null);
    try {
      const result = await transferPdfPage({
        sourceBytes: source.bytes,
        destinationBytes: destination.bytes,
        sourcePage,
        destinationPage,
        mode,
      });
      const baseName = destination.file.name.replace(/\.pdf$/i, '');
      download(result, `${baseName}-organized.pdf`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create the organized PDF.');
    } finally {
      setWorking(false);
    }
  };

  const swapDocuments = () => {
    if (!source || !destination) return;
    setSource(destination);
    setDestination(source);
    setSourcePage(destinationPage);
    setDestinationPage(sourcePage);
  };

  const actionCopy = mode === 'replace'
    ? `Replace page ${destinationPage}`
    : `Insert ${mode} page ${destinationPage}`;

  return (
    <main className="organizer-shell">
      <header className="organizer-header">
        <Logo />
        <button className="secondary-button" onClick={onClose}>
          <ArrowLeft size={16} /> Back to editor
        </button>
      </header>

      <section className="organizer-intro">
        <div>
          <p className="eyebrow">Page organizer</p>
          <h1>Move a page between two PDFs.</h1>
          <p>Select a page from one document, then insert or replace a page in another.</p>
        </div>
        <span className="local-badge"><LockKeyhole size={14} /> Files stay on this device</span>
      </section>

      {error && <div className="organizer-error" role="alert">{error}</div>}

      <div className="organizer-grid">
        <PdfPicker
          label="01 · Source"
          description="PDF to copy from"
          pdf={source}
          page={sourcePage}
          onPageChange={setSourcePage}
          onFile={(file) => void loadPdf(file, 'source')}
        />

        <button
          className="organizer-transfer"
          onClick={swapDocuments}
          disabled={!source || !destination}
          aria-label="Swap source and destination PDFs"
          title={source && destination ? 'Swap source and destination PDFs' : 'Choose both PDFs to swap them'}
        >
          <span><ArrowRightLeft size={21} /></span>
          <strong>Transfer</strong>
          <small>Swap PDFs</small>
        </button>

        <PdfPicker
          label="02 · Destination"
          description="PDF to change"
          pdf={destination}
          page={destinationPage}
          onPageChange={setDestinationPage}
          onFile={(file) => void loadPdf(file, 'destination')}
        />
      </div>

      <section className="organizer-action-panel">
        <div>
          <span className="organizer-step">03 · Choose action</span>
          <h2>Where should source page {sourcePage} go?</h2>
        </div>
        <div className="mode-options" aria-label="Page transfer action">
          {([
            ['replace', 'Replace', 'Remove the destination page and put the source page in its place'],
            ['before', 'Insert before', 'Keep the destination page and add the source page before it'],
            ['after', 'Insert after', 'Keep the destination page and add the source page after it'],
          ] as const).map(([value, title, description]) => (
            <button
              key={value}
              className={mode === value ? 'active' : ''}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              <strong>{title}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>
        <div className="organizer-summary">
          <FileText size={20} />
          <p>
            Copy page <strong>{sourcePage}</strong> from <strong>{source?.file.name ?? 'the source PDF'}</strong>.
            {' '}{actionCopy} in <strong>{destination?.file.name ?? 'the destination PDF'}</strong>.
          </p>
          <button
            className="organizer-download"
            disabled={!source || !destination || working}
            onClick={() => void createPdf()}
          >
            <Download size={18} />
            {working ? 'Creating PDF…' : 'Create & download PDF'}
          </button>
        </div>
        <p className="organizer-note">
          Your original files are never changed. Paperwood creates a new PDF entirely in your browser.
        </p>
      </section>
    </main>
  );
}
