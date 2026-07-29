import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { transferPdfPage, type PageTransferMode } from './pageOrganizer';

async function makePdf(widths: number[]) {
  const document = await PDFDocument.create();
  widths.forEach((width) => document.addPage([width, 500]));
  return document.save();
}

async function pageWidths(bytes: Uint8Array) {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => page.getWidth());
}

describe('transferPdfPage', () => {
  it('replaces a destination page without changing the page count', async () => {
    const result = await transferPdfPage({
      sourceBytes: await makePdf([111, 444]),
      destinationBytes: await makePdf([200, 300, 400]),
      sourcePage: 2,
      destinationPage: 2,
      mode: 'replace',
    });

    expect(await pageWidths(result)).toEqual([200, 444, 400]);
  });

  it.each([
    ['before', [200, 444, 300]],
    ['after', [200, 300, 444]],
  ] satisfies [PageTransferMode, number[]][])(
    'inserts the source page %s the selected destination page',
    async (mode, expected) => {
      const result = await transferPdfPage({
        sourceBytes: await makePdf([444]),
        destinationBytes: await makePdf([200, 300]),
        sourcePage: 1,
        destinationPage: 2,
        mode,
      });

      expect(await pageWidths(result)).toEqual(expected);
    },
  );

  it('rejects page numbers outside either document', async () => {
    await expect(transferPdfPage({
      sourceBytes: await makePdf([100]),
      destinationBytes: await makePdf([200]),
      sourcePage: 2,
      destinationPage: 1,
      mode: 'replace',
    })).rejects.toThrow('Choose a valid source page.');
  });
});
