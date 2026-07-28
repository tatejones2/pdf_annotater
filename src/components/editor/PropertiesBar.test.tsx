import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PropertiesBar } from './PropertiesBar';
import { useEditorStore } from '../../stores/useEditorStore';

afterEach(() => {
  cleanup();
  useEditorStore.setState({
    annotations: [],
    selectedId: null,
    activeTool: 'select',
    textBold: false,
    textItalic: false,
    textUnderline: false,
  });
});

describe('PropertiesBar text formatting', () => {
  it('sets formatting defaults for newly placed text', () => {
    useEditorStore.setState({ activeTool: 'text' });
    render(<PropertiesBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Bold text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Underline text' }));

    const state = useEditorStore.getState();
    expect(state.textBold).toBe(true);
    expect(state.textItalic).toBe(true);
    expect(state.textUnderline).toBe(true);
  });

  it('updates the currently selected text annotation', () => {
    const id = useEditorStore.getState().add(
      'text',
      0,
      { x: 0.1, y: 0.1, width: 0.2, height: 0.05 },
      { text: 'Signed', fontFamily: 'signature', fontSize: 20 },
    );
    useEditorStore.setState({ activeTool: 'select', selectedId: id });
    render(<PropertiesBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Bold text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Underline text' }));

    const annotation = useEditorStore
      .getState()
      .annotations.find((item) => item.id === id);
    expect(annotation).toMatchObject({
      bold: true,
      italic: true,
      underlineText: true,
    });
  });
});
