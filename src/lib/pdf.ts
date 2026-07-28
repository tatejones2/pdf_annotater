import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import type { Annotation } from '../types/annotations';
import { normalizedRectToPdf } from './coordinates';
import signatureFontUrl from '../assets/fonts/GreatVibes-Regular.ttf?url';

const hex = (value: string) => {
  const clean = value.replace('#', '');
  const int = Number.parseInt(clean.length === 3 ? clean.split('').map((x) => x + x).join('') : clean, 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
};

export async function exportAnnotatedPdf(bytes: Uint8Array, annotations: Annotation[]) {
  const document = await PDFDocument.load(bytes);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await document.embedFont(StandardFonts.HelveticaOblique);
  const boldItalicFont = await document.embedFont(StandardFonts.HelveticaBoldOblique);
  let signatureFont: PDFFont | undefined;
  if (annotations.some((annotation) => annotation.type === 'text' && annotation.fontFamily === 'signature')) {
    document.registerFontkit(fontkit);
    const signatureFontBytes = await fetch(signatureFontUrl).then((response) => {
      if (!response.ok) throw new Error('Unable to load the bundled signature font.');
      return response.arrayBuffer();
    });
    signatureFont = await document.embedFont(signatureFontBytes, { subset: true });
  }
  const pages = document.getPages();

  annotations
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach((annotation) => {
      const page = pages[annotation.pageIndex];
      if (!page) return;
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const rect = normalizedRectToPdf(annotation.rect, pageWidth, pageHeight);
      const color = hex(annotation.color);
      const fill = hex(annotation.fillColor ?? annotation.color);
      if (annotation.type === 'text' || annotation.type === 'sticky-note') {
        if (annotation.type === 'sticky-note') {
          page.drawRectangle({ ...rect, color: fill, opacity: 0.9, borderColor: color, borderWidth: 1 });
        }
        const text = annotation.text?.trim() || (annotation.type === 'sticky-note' ? 'Note' : 'Text');
        const textFont = annotation.fontFamily === 'signature'
          ? signatureFont ?? font
          : annotation.bold && annotation.italic
            ? boldItalicFont
            : annotation.bold
              ? boldFont
              : annotation.italic
                ? italicFont
                : font;
        const textSize = annotation.fontSize ?? 12;
        const textX = rect.x + 4;
        const textY = rect.y + rect.height - textSize;
        const drawOptions = {
          x: textX,
          y: textY,
          maxWidth: Math.max(20, rect.width - 8),
          size: textSize,
          font: textFont,
          color,
          opacity: annotation.opacity,
          lineHeight: textSize * 1.2,
        };
        page.drawText(text.slice(0, 600), drawOptions);
        if (annotation.fontFamily === 'signature' && annotation.bold) {
          page.drawText(text.slice(0, 600), { ...drawOptions, x: textX + 0.45 });
        }
        if (annotation.underlineText) {
          const firstLine = text.split('\n')[0] ?? '';
          const textWidth = Math.min(
            rect.width - 8,
            textFont.widthOfTextAtSize(firstLine, textSize),
          );
          page.drawLine({
            start: { x: textX, y: textY - 2 },
            end: { x: textX + Math.max(0, textWidth), y: textY - 2 },
            thickness: Math.max(0.7, textSize / 18),
            color,
            opacity: annotation.opacity,
          });
        }
      } else if (annotation.type === 'highlight') {
        page.drawRectangle({ ...rect, color: fill, opacity: annotation.opacity });
      } else if (annotation.type === 'underline') {
        page.drawLine({
          start: { x: rect.x, y: rect.y },
          end: { x: rect.x + rect.width, y: rect.y },
          thickness: annotation.width,
          color,
          opacity: annotation.opacity,
        });
      } else if (annotation.type === 'rectangle') {
        page.drawRectangle({
          ...rect,
          color: fill,
          borderColor: color,
          borderWidth: annotation.width,
          opacity: annotation.opacity * 0.45,
          borderOpacity: annotation.opacity,
        });
      } else if (annotation.type === 'ellipse') {
        page.drawEllipse({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          xScale: rect.width / 2,
          yScale: rect.height / 2,
          color: fill,
          borderColor: color,
          borderWidth: annotation.width,
          opacity: annotation.opacity * 0.45,
          borderOpacity: annotation.opacity,
        });
      } else if (annotation.type === 'pen' && annotation.points) {
        annotation.points.slice(1).forEach((point, index) => {
          const previous = annotation.points?.[index];
          if (!previous) return;
          page.drawLine({
            start: { x: previous.x * pageWidth, y: (1 - previous.y) * pageHeight },
            end: { x: point.x * pageWidth, y: (1 - point.y) * pageHeight },
            thickness: annotation.width,
            color,
            opacity: annotation.opacity,
          });
        });
      } else {
        const start = { x: rect.x, y: rect.y };
        const end = { x: rect.x + rect.width, y: rect.y + rect.height };
        page.drawLine({ start, end, thickness: annotation.width, color, opacity: annotation.opacity });
        if (annotation.type === 'arrow') {
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          for (const offset of [-0.55, 0.55]) {
            page.drawLine({
              start: end,
              end: { x: end.x - 12 * Math.cos(angle + offset), y: end.y - 12 * Math.sin(angle + offset) },
              thickness: annotation.width,
              color,
              opacity: annotation.opacity,
            });
          }
        }
      }
    });

  return document.save();
}
