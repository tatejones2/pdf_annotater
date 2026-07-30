import { useRef, useState } from 'react';
import { ArrowRightLeft, Download, FileText, Highlighter, LockKeyhole, MessageSquareText, PenLine, Trash2, Upload } from 'lucide-react';
import { APP_CONFIG } from '../../app/config';
import { Logo } from '../common/Logo';

type Props = {
  onOpen: (file: File) => void;
  error: string | null;
  notice?: string | null;
  recentName?: string;
  onDownloadRecent?: () => void;
  onDismissRecent?: () => void;
  onOrganize: () => void;
  onShowSecurity: () => void;
};

export function Welcome({
  onOpen,
  error,
  notice,
  recentName,
  onDownloadRecent,
  onDismissRecent,
  onOrganize,
  onShowSecurity,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onOpen(file);
  };

  return (
    <main className="welcome">
      <header className="welcome-header">
        <Logo />
        <span className="local-badge">
          <LockKeyhole size={14} /> Local-first
        </span>
      </header>

      <section className="welcome-hero">
        <div className="hero-copy">
          <p className="eyebrow">A quieter way to work with PDFs</p>
          <h1>
            Annotate PDFs,
            <br />
            <em>right in your browser.</em>
          </h1>
          <p className="hero-lede">
            Highlight, draw, add notes, and export—without uploading your document.
          </p>
          <div className="tool-chips" aria-label="Supported annotation tools">
            <span><Highlighter size={16} /> Highlight</span>
            <span><PenLine size={16} /> Draw</span>
            <span><MessageSquareText size={16} /> Notes</span>
          </div>
        </div>

        <div className="upload-composition">
          <div className="shape shape-sun" />
          <div className="shape shape-arch" />
          <button
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              accept(event.dataTransfer.files);
            }}
          >
            <span className="upload-icon"><Upload size={27} /></span>
            <strong>Drop your PDF here</strong>
            <span>or choose one from your device</span>
            <span className="choose-button">Choose PDF</span>
            <small>PDF · Recommended max 50 MB</small>
          </button>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => accept(event.target.files)}
          />
        </div>
      </section>

      {error && <div className="welcome-error" role="alert">{error}</div>}
      {notice && <div className="welcome-notice" role="status">{notice}</div>}
      {recentName && onDownloadRecent && (
        <aside className="legacy-data-card">
          <FileText size={20} />
          <span>
            <strong>Older unencrypted draft found</strong>
            <small>{recentName} · Download it or permanently remove it from this browser.</small>
          </span>
          <button onClick={onDownloadRecent}><Download size={15} /> Download</button>
          <button className="danger-button" onClick={onDismissRecent}><Trash2 size={15} /> Delete local data</button>
        </aside>
      )}

      <section className="organize-entry">
        <span className="organize-entry-icon"><ArrowRightLeft size={23} /></span>
        <div>
          <strong>Need to move pages between PDFs?</strong>
          <p>Copy, insert, or replace pages using two documents.</p>
        </div>
        <button onClick={onOrganize}>Open page organizer</button>
      </section>

      <section className="privacy-strip">
        <span className="privacy-number">01</span>
        <div>
          <strong>Private session · Nothing is saved automatically.</strong>
          <p>Paperwood processes documents in this browser. Export before closing or refreshing.</p>
          <button className="privacy-link" onClick={onShowSecurity}>Review safe-use guidance</button>
        </div>
        <LockKeyhole size={28} />
      </section>

      <footer className="welcome-footer">
        <span>© {new Date().getFullYear()} {APP_CONFIG.name}</span>
        <span>Private by design · Free to use · Works offline after loading</span>
      </footer>
    </main>
  );
}
