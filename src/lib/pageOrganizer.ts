import { PDFDocument } from 'pdf-lib';

export type PageTransferMode = 'replace' | 'before' | 'after';

type TransferOptions = {
  sourceBytes: Uint8Array;
  destinationBytes: Uint8Array;
  sourcePage: number;
  destinationPage: number;
  mode: PageTransferMode;
};

export async function transferPdfPage({
  sourceBytes,
  destinationBytes,
  sourcePage,
  destinationPage,
  mode,
}: TransferOptions) {
  const source = await PDFDocument.load(sourceBytes);
  const destination = await PDFDocument.load(destinationBytes);

  if (!Number.isInteger(sourcePage) || sourcePage < 1 || sourcePage > source.getPageCount()) {
    throw new RangeError('Choose a valid source page.');
  }
  if (
    !Number.isInteger(destinationPage)
    || destinationPage < 1
    || destinationPage > destination.getPageCount()
  ) {
    throw new RangeError('Choose a valid destination page.');
  }

  const [copiedPage] = await destination.copyPages(source, [sourcePage - 1]);
  const destinationIndex = destinationPage - 1;

  if (mode === 'replace') {
    destination.removePage(destinationIndex);
    destination.insertPage(destinationIndex, copiedPage);
  } else {
    destination.insertPage(
      mode === 'before' ? destinationIndex : destinationIndex + 1,
      copiedPage,
    );
  }

  return destination.save();
}
