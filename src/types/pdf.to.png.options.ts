export type PdfToPngOptions = {
    targetWidth?: number;
    targetHeight?: number;
    viewportScale: 1;
    disableFontFace?: boolean;
    useSystemFonts?: boolean;
    enableXfa?: boolean;
    pdfFilePassword?: string;
    outputFolder?: string;
    outputFileMask?: string;
    pagesToProcess?: number[];
    strictPagesToProcess?: boolean;
    verbosityLevel?: number;
};
