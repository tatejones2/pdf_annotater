import Dexie, { type EntityTable } from 'dexie';
import type { Annotation } from '../types/annotations';

export type SavedProject = {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
  annotations: Annotation[];
  zoom: number;
  currentPage: number;
  updatedAt: number;
};

const database = new Dexie('paperwood') as Dexie & {
  projects: EntityTable<SavedProject, 'id'>;
};
database.version(1).stores({ projects: 'id, updatedAt' });

export const getLegacyProject = () => database.projects.orderBy('updatedAt').last();

export const clearLegacyProject = async () => {
  await database.close();
  await Dexie.delete('paperwood');
};
