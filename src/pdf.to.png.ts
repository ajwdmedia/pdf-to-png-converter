import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { promises } from 'node:fs';
import { parse, resolve } from 'node:path';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import * as pdfDisplayUtilsTypes from 'pdfjs-dist/types/src/display/display_utils';
import { PdfToPngOptions, PngPageOutput } from '.';
import { PDF_TO_PNG_OPTIONS_DEFAULTS } from './const';
import { CanvasContext, NodeCanvasFactory } from './node.canvas.factory';
import { propsToPdfDocInitParams } from './props.to.pdf.doc.init.params';

/**
 * Converts a PDF file to PNG images.
 * @param pdfFilePathOrBuffer - The path to the PDF file or a buffer containing the PDF file.
 * @param props - Optional configuration options for the conversion process.
 * @returns An array of objects containing information about each generated PNG image.
 */
export async function pdfToPng(pdfFilePathOrBuffer: string | ArrayBufferLike, props?: PdfToPngOptions): Promise<PngPageOutput[]> {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const isBuffer: boolean = Buffer.isBuffer(pdfFilePathOrBuffer);

    const pdfFileBuffer: ArrayBuffer = isBuffer
        ? (pdfFilePathOrBuffer as ArrayBuffer)
        : await promises.readFile(pdfFilePathOrBuffer as string);

    const pdfDocInitParams: pdfApiTypes.DocumentInitParameters = propsToPdfDocInitParams(props);
    pdfDocInitParams.data = new Uint8Array(pdfFileBuffer);

    const canvasFactory = new NodeCanvasFactory();
    pdfDocInitParams.canvasFactory = canvasFactory;

    const pdfDocument: pdfApiTypes.PDFDocumentProxy = await getDocument(pdfDocInitParams).promise;
    const targetedPageNumbers: number[] =
        props?.pagesToProcess !== undefined
            ? props.pagesToProcess
            : Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1);

    if (props?.strictPagesToProcess && targetedPageNumbers.some((pageNum) => pageNum < 1)) {
        throw new Error('Invalid pages requested, page number must be >= 1');
    }
    if (props?.strictPagesToProcess && targetedPageNumbers.some((pageNum) => pageNum > pdfDocument.numPages)) {
        throw new Error('Invalid pages requested, page number must be <= total pages');
    }
    if (props?.outputFolder) {
        await promises.mkdir(props.outputFolder, { recursive: true });
    }

    let pageName;
    if (props?.outputFileMask) {
        pageName = props.outputFileMask;
    }
    if (!pageName && !isBuffer) {
        pageName = parse(pdfFilePathOrBuffer as string).name;
    }
    if (!pageName) {
        pageName = PDF_TO_PNG_OPTIONS_DEFAULTS.outputFileMask;
    }

    const pngPagesOutput: PngPageOutput[] = [];

    for (const pageNumber of targetedPageNumbers) {
        if (pageNumber > pdfDocument.numPages || pageNumber < 1) {
            // If a requested page is beyond the PDF bounds we skip it.
            // This allows the use case "generate up to the first n pages from a set of input PDFs"
            continue;
        }
        const page: pdfApiTypes.PDFPageProxy = await pdfDocument.getPage(pageNumber);
        const initialViewport = page.getViewport({ scale: 1 });
        let resolvedScale: number = PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale;
        if (props?.targetWidth && props?.targetHeight) resolvedScale = Math.min(props.targetWidth / initialViewport.width, props.targetHeight / initialViewport.height);
        else if (props?.targetWidth) resolvedScale = props.targetWidth / initialViewport.width;
        else if (props?.targetHeight) resolvedScale = props.targetHeight / initialViewport.height;

        if (props?.viewportScale) resolvedScale = props.viewportScale;

        const viewport: pdfDisplayUtilsTypes.PageViewport = page.getViewport({ scale: resolvedScale });
        const canvasAndContext: CanvasContext = canvasFactory.create(viewport.width, viewport.height);

        const renderContext: pdfApiTypes.RenderParameters = {
            canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
            viewport,
        };

        await page.render(renderContext).promise;

        const pngPageOutput: PngPageOutput = {
            pageNumber,
            name: `${pageName}_page_${pageNumber}.png`,
            content: (canvasAndContext.canvas as Canvas).toBuffer(),
            path: '',
            width: viewport.width,
            height: viewport.height,
        };

        canvasFactory.destroy(canvasAndContext);
        page.cleanup();

        if (props?.outputFolder) {
            pngPageOutput.path = resolve(props.outputFolder, pngPageOutput.name);
            await promises.writeFile(pngPageOutput.path, pngPageOutput.content);
        }

        pngPagesOutput.push(pngPageOutput);
    }
    await pdfDocument.cleanup();
    return pngPagesOutput;
}
