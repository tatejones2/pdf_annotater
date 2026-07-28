import { z } from 'zod';

export const pointSchema = z.object({ x: z.number(), y: z.number() });
export const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type NormalizedPoint = z.infer<typeof pointSchema>;
export type NormalizedRect = z.infer<typeof rectSchema>;
export type Tool =
  | 'select'
  | 'highlight'
  | 'underline'
  | 'text'
  | 'sticky-note'
  | 'pen'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow';

export type AnnotationType = Exclude<Tool, 'select'>;

export type Annotation = {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  rect: NormalizedRect;
  points?: NormalizedPoint[];
  text?: string;
  color: string;
  fillColor?: string | null;
  opacity: number;
  width: number;
  fontSize?: number;
  fontFamily?: 'sans' | 'signature';
  bold?: boolean;
  italic?: boolean;
  underlineText?: boolean;
  locked: boolean;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
};

export const annotationSchema: z.ZodType<Annotation> = z.object({
  id: z.string(),
  type: z.enum([
    'highlight',
    'underline',
    'text',
    'sticky-note',
    'pen',
    'rectangle',
    'ellipse',
    'line',
    'arrow',
  ]),
  pageIndex: z.number().int().nonnegative(),
  rect: rectSchema,
  points: z.array(pointSchema).optional(),
  text: z.string().optional(),
  color: z.string(),
  fillColor: z.string().nullable().optional(),
  opacity: z.number().min(0).max(1),
  width: z.number().positive(),
  fontSize: z.number().positive().optional(),
  fontFamily: z.enum(['sans', 'signature']).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underlineText: z.boolean().optional(),
  locked: z.boolean(),
  zIndex: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string(),
  originalFileName: z.string(),
  pdfByteLength: z.number(),
  annotations: z.array(annotationSchema),
  viewState: z.object({
    zoom: z.number(),
    currentPage: z.number(),
  }),
  pdfBase64: z.string(),
});

export type PortableProject = z.infer<typeof projectSchema>;
