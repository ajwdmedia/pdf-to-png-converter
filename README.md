# @ajwdmedia/pdf-to-png-converter

Node.js utility to convert PDF file/buffer pages to PNG files/buffers without binary and OS dependencies (except MacOs on arm64).  

Adds support for specifying a target resolution instead of scale.  
This version is less maintained than `png-to-pdf-converter`. If you don't need resolution controls, use the original.  

## Getting started

### MacOs M1 prerequisites

MacOs M1 dependencies prerequisites installation

```bash
arch -arm64 brew install pkg-config cairo pango libpng librsvg
```

### Package installation

Installation:

```sh
npm install @ajwdmedia/pdf-to-png-converter
```

## Example

```javascript
test(`Convert PDF To PNG`, async () => {
    const pngPages: PngPageOutput[] = await pdfToPng(pdfFilePath, // The function accepts PDF file path or a Buffer
    {
        disableFontFace: false, // When `false`, fonts will be rendered using a built-in font renderer that constructs the glyphs with primitive path commands. Default value is true.
        useSystemFonts: false, // When `true`, fonts that aren't embedded in the PDF document will fallback to a system font. Default value is false.
        enableXfa: false, // Render Xfa forms if any. Default value is false.
        targetWidth: 1920,
        targetHeight: 1080, // Specify a target width and height. Will scale to fit within the bounds (similar to "object-fit: cover"). If only one is specified, the other is implied.
        viewportScale: 2.0, // The desired scale of PNG viewport. Default value is 1.0. Takes precedence over resolution controls if specified.
        outputFolder: 'output/folder', // Folder to write output PNG files. If not specified, PNG output will be available only as a Buffer content, without saving to a file.
        outputFileMask: 'buffer', // Output filename mask. Default value is 'buffer'.
        pdfFilePassword: 'pa$$word', // Password for encrypted PDF.
        pagesToProcess: [1, 3, 11],   // Subset of pages to convert (first page = 1), other pages will be skipped if specified.
        strictPagesToProcess: false, // When `true`, will throw an error if specified page number in pagesToProcess is invalid, otherwise will skip invalid page. Default value is false.
        verbosityLevel: 0 // Verbosity level. ERRORS: 0, WARNINGS: 1, INFOS: 5. Default value is 0.
    });
   ...
});
```

## Output

```javascript
{
    pageNumber: number; // Page number in PDF file
    name: string; // PNG page name in a format `{pdfFileName}_page_{pdfPageNumber}.png`
    content: Buffer; // PNG page Buffer content
    path: string; // Path to the rendered PNG page file (empty string and if outputFilesFolder is not provided)
    width: number; // PNG page width
    height: number; // PNG page height
}
```

## Support

This is a fork of the [original project](https://github.com/dichovsky/pdf-to-png-converter). If you would like to support, please send love to the original maintainer.
