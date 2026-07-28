import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Annotation, AnnotationType, NormalizedRect, Tool } from '../types/annotations';

type Snapshot = Annotation[];

type EditorState = {
  annotations: Annotation[];
  past: Snapshot[];
  future: Snapshot[];
  selectedId: string | null;
  activeTool: Tool;
  color: string;
  fillColor: string;
  opacity: number;
  strokeWidth: number;
  textFont: 'sans' | 'signature';
  dirty: boolean;
  setTool: (tool: Tool) => void;
  setStyle: (style: Partial<Pick<EditorState, 'color' | 'fillColor' | 'opacity' | 'strokeWidth' | 'textFont'>>) => void;
  add: (type: AnnotationType, pageIndex: number, rect: NormalizedRect, extra?: Partial<Annotation>) => string;
  update: (id: string, patch: Partial<Annotation>) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  duplicate: () => void;
  reorder: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  undo: () => void;
  redo: () => void;
  load: (annotations: Annotation[]) => void;
  markSaved: () => void;
  clear: () => void;
};

const clone = (value: Annotation[]) => structuredClone(value);

export const useEditorStore = create<EditorState>((set, get) => ({
  annotations: [],
  past: [],
  future: [],
  selectedId: null,
  activeTool: 'select',
  color: '#c86b3c',
  fillColor: '#d0a43c',
  opacity: 0.55,
  strokeWidth: 3,
  textFont: 'sans',
  dirty: false,
  setTool: (activeTool) => set({ activeTool }),
  setStyle: (style) => set(style),
  add: (type, pageIndex, rect, extra = {}) => {
    const state = get();
    const id = nanoid();
    const now = new Date().toISOString();
    const annotation: Annotation = {
      id,
      type,
      pageIndex,
      rect,
      color: state.color,
      fillColor: state.fillColor,
      opacity: state.opacity,
      width: state.strokeWidth,
      locked: false,
      zIndex: Math.max(0, ...state.annotations.map((item) => item.zIndex + 1)),
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
    set({
      past: [...state.past.slice(-99), clone(state.annotations)],
      future: [],
      annotations: [...state.annotations, annotation],
      selectedId: id,
      dirty: true,
    });
    return id;
  },
  update: (id, patch) => {
    const state = get();
    set({
      past: [...state.past.slice(-99), clone(state.annotations)],
      future: [],
      annotations: state.annotations.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
      dirty: true,
    });
  },
  remove: (id) => {
    const state = get();
    set({
      past: [...state.past.slice(-99), clone(state.annotations)],
      future: [],
      annotations: state.annotations.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      dirty: true,
    });
  },
  select: (selectedId) => set({ selectedId }),
  duplicate: () => {
    const state = get();
    const source = state.annotations.find((item) => item.id === state.selectedId);
    if (!source) return;
    get().add(source.type, source.pageIndex, {
      ...source.rect,
      x: Math.min(0.95, source.rect.x + 0.02),
      y: Math.min(0.95, source.rect.y + 0.02),
    }, { ...source, id: undefined });
  },
  reorder: (direction) => {
    const state = get();
    const selected = state.annotations.find((item) => item.id === state.selectedId);
    if (!selected) return;
    const values = state.annotations.map((item) => item.zIndex);
    const patch =
      direction === 'front'
        ? Math.max(...values) + 1
        : direction === 'back'
          ? Math.min(...values) - 1
          : selected.zIndex + (direction === 'forward' ? 1 : -1);
    get().update(selected.id, { zIndex: patch });
  },
  undo: () => {
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return;
    set({
      annotations: previous,
      past: state.past.slice(0, -1),
      future: [clone(state.annotations), ...state.future].slice(0, 100),
      selectedId: null,
      dirty: true,
    });
  },
  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      annotations: next,
      past: [...state.past, clone(state.annotations)].slice(-100),
      future: state.future.slice(1),
      selectedId: null,
      dirty: true,
    });
  },
  load: (annotations) => set({
    annotations: annotations.map((annotation) =>
      annotation.type === 'text'
        ? { ...annotation, color: '#25231f', fillColor: null, opacity: 1 }
        : annotation,
    ),
    past: [],
    future: [],
    selectedId: null,
    dirty: false,
  }),
  markSaved: () => set({ dirty: false }),
  clear: () => set({ annotations: [], past: [], future: [], selectedId: null, dirty: false }),
}));
