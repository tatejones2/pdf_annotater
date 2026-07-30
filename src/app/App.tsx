import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocument, type PDFDocumentProxy } from '../lib/pdfjs';
import { Welcome } from '../components/welcome/Welcome';
import { Editor } from '../components/editor/Editor';
import { APP_CONFIG } from './config';
import { clearLegacyProject, getLegacyProject, type SavedProject } from '../lib/persistence';
import { useEditorStore } from '../stores/useEditorStore';
import { PageOrganizer } from '../components/organizer/PageOrganizer';
import { SecurityNotice } from '../components/security/SecurityNotice';

type ActiveDocument = {
  fileName: string;
  bytes: Uint8Array;
  pdf: PDFDocumentProxy;
};

const hasAcceptedSecurityNotice = () => {
  try {
    return sessionStorage.getItem('paperwood-security-accepted') === '1';
  } catch {
    return false;
  }
};

const rememberSecurityNotice = () => {
  try {
    sessionStorage.setItem('paperwood-security-accepted', '1');
  } catch {
    // The notice still works when browser session storage is disabled.
  }
};

export default function App() {
  const [active, setActive] = useState<ActiveDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recent, setRecent] = useState<SavedProject | undefined>();
  const [organizing, setOrganizing] = useState(false);
  const [securityAccepted, setSecurityAccepted] = useState(hasAcceptedSecurityNotice);
  const dirty = useEditorStore((state) => state.dirty);
  const clear = useEditorStore((state) => state.clear);
  const activeRef = useRef<ActiveDocument | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!securityAccepted) return;
    void getLegacyProject().then(setRecent).catch(() => undefined);
  }, [securityAccepted]);

  useEffect(() => () => {
    const document = activeRef.current;
    if (!document) return;
    void document.pdf.cleanup();
    document.bytes.fill(0);
    clear();
  }, [clear]);

  const loadBytes = useCallback(async (bytes: Uint8Array, fileName: string) => {
    setLoading(true);
    setError(null);
    try {
      const task = getDocument({ data: bytes.slice() });
      const pdf = await task.promise;
      clear();
      setActive({ fileName, bytes, pdf });
    } catch (reason) {
      bytes.fill(0);
      const message = reason instanceof Error && /password/i.test(reason.message)
        ? 'This PDF is password protected. Please unlock it before opening.'
        : 'We couldn’t read this PDF. It may be damaged or use an unsupported format.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clear]);

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
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [active, dirty]);

  const close = () => {
    if (
      dirty
      && !window.confirm('Close this private session? Export first or your unsaved changes will be discarded.')
    ) return;
    if (active) {
      void active.pdf.cleanup();
      active.bytes.fill(0);
    }
    setActive(null);
    clear();
  };

  const downloadLegacyProject = (project: SavedProject) => {
    let binary = '';
    for (const byte of new Uint8Array(project.bytes)) binary += String.fromCharCode(byte);
    const data = JSON.stringify({
      schemaVersion: APP_CONFIG.schemaVersion,
      name: project.fileName.replace(/\.pdf$/i, ''),
      originalFileName: project.fileName,
      pdfByteLength: project.bytes.byteLength,
      annotations: project.annotations,
      viewState: { zoom: project.zoom, currentPage: project.currentPage },
      pdfBase64: btoa(binary),
    }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const anchor = globalThis.document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.fileName.replace(/\.pdf$/i, '')}.paperwood.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!securityAccepted) {
    return <SecurityNotice onAccept={() => {
      rememberSecurityNotice();
      setSecurityAccepted(true);
    }} />;
  }

  if (loading) return <main className="loading-screen"><div className="loading-mark" /><strong>Opening your document…</strong><span>Everything is staying on this device.</span></main>;
  if (organizing) return <PageOrganizer onClose={() => setOrganizing(false)} />;
  if (!active) return (
    <Welcome
      onOpen={(file) => void openFile(file)}
      error={error}
      notice={notice}
      recentName={recent?.fileName}
      onDownloadRecent={recent ? () => downloadLegacyProject(recent) : undefined}
      onDismissRecent={() => {
        if (!window.confirm('Permanently delete the older Paperwood draft from this browser? This cannot be undone.')) return;
        void clearLegacyProject()
          .then(() => {
            setRecent(undefined);
            setNotice('The older browser draft was permanently removed.');
          })
          .catch(() => setError('Paperwood could not remove the older browser draft.'));
      }}
      onOrganize={() => setOrganizing(true)}
      onShowSecurity={() => setSecurityAccepted(false)}
    />
  );

  return (
    <Editor
      document={active.pdf}
      bytes={active.bytes}
      fileName={active.fileName}
      onClose={close}
    />
  );
}
