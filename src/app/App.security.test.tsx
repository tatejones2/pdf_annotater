import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEditorStore } from '../stores/useEditorStore';
import App from './App';

const securityMocks = vi.hoisted(() => ({
  cleanupPdf: vi.fn(),
  getLegacyProject: vi.fn(async () => undefined),
  clearLegacyProject: vi.fn(async () => undefined),
  sensitiveBytes: new Uint8Array([11, 22, 33, 44]),
}));

vi.mock('../lib/persistence', () => ({
  getLegacyProject: securityMocks.getLegacyProject,
  clearLegacyProject: securityMocks.clearLegacyProject,
}));

vi.mock('../lib/pdfjs', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      cleanup: securityMocks.cleanupPdf,
    }),
  })),
}));

vi.mock('../components/welcome/Welcome', () => ({
  Welcome: ({ onOpen }: { onOpen: (file: File) => void }) => (
    <button onClick={() => {
      const file = new File(['sensitive'], 'tax-return.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => securityMocks.sensitiveBytes.buffer,
      });
      onOpen(file);
    }}>
      Open sensitive PDF
    </button>
  ),
}));

vi.mock('../components/editor/Editor', () => ({
  Editor: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>Close private session</button>
  ),
}));

beforeEach(() => {
  sessionStorage.setItem('paperwood-security-accepted', '1');
  securityMocks.cleanupPdf.mockClear();
  securityMocks.getLegacyProject.mockClear();
  securityMocks.sensitiveBytes.set([11, 22, 33, 44]);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  useEditorStore.getState().clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('App private sessions', () => {
  it('warns before leaving edited work and clears PDF resources on close', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open sensitive PDF' }));
    await screen.findByRole('button', { name: 'Close private session' });

    useEditorStore.getState().add(
      'text',
      0,
      { x: 0.1, y: 0.1, width: 0.2, height: 0.05 },
      { text: '123-45-6789' },
    );

    await waitFor(() => expect(useEditorStore.getState().dirty).toBe(true));
    const leaveEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leaveEvent);
    expect(leaveEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Close private session' }));
    expect(window.confirm).toHaveBeenCalledWith(
      'Close this private session? Export first or your unsaved changes will be discarded.',
    );
    expect(securityMocks.cleanupPdf).toHaveBeenCalledOnce();
    expect([...securityMocks.sensitiveBytes]).toEqual([0, 0, 0, 0]);
    expect(useEditorStore.getState().annotations).toEqual([]);
    expect(await screen.findByRole('button', { name: 'Open sensitive PDF' })).toBeInTheDocument();
  });

  it('shows the security gate when the session has not acknowledged the risks', () => {
    sessionStorage.clear();
    render(<App />);

    expect(screen.getByRole('dialog', { name: 'Use sensitive documents carefully.' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open sensitive PDF' })).not.toBeInTheDocument();
    expect(securityMocks.getLegacyProject).not.toHaveBeenCalled();
  });
});
