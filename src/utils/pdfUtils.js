import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';

// PDF.js worker 설정 (v5.x)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Security limits to prevent DoS attacks
const MAX_PAGES = 500;  // Maximum pages per PDF
const MAX_CANVAS_PIXELS = 16777216;  // 4096 x 4096 = 16M pixels max
const MAX_MERGE_FILES = 50;  // Maximum files to merge at once

/**
 * PDF 파일 로드
 */
export const loadPdfDocument = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
};

/**
 * PDF 페이지를 이미지로 변환
 */
export const pdfPageToImage = async (pdfDoc, pageNum, scale = 2, format = 'image/png') => {
  const page = await pdfDoc.getPage(pageNum);
  let viewport = page.getViewport({ scale });

  // Prevent canvas memory exhaustion by limiting pixel count
  const totalPixels = viewport.width * viewport.height;
  if (totalPixels > MAX_CANVAS_PIXELS) {
    const reductionFactor = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels);
    const safeScale = scale * reductionFactor;
    viewport = page.getViewport({ scale: safeScale });
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, format, format === 'image/jpeg' ? 0.92 : undefined);
  });
};

/**
 * PDF 전체를 이미지들로 변환
 */
export const pdfToImages = async (file, scale = 2, format = 'image/png', onProgress) => {
  const pdfDoc = await loadPdfDocument(file);
  const numPages = pdfDoc.numPages;

  // Limit pages to prevent DoS
  if (numPages > MAX_PAGES) {
    throw new Error(`PDF has too many pages (${numPages}). Maximum allowed: ${MAX_PAGES}`);
  }

  const images = [];

  for (let i = 1; i <= numPages; i++) {
    const imageBlob = await pdfPageToImage(pdfDoc, i, scale, format);
    images.push({
      pageNum: i,
      blob: imageBlob,
      url: URL.createObjectURL(imageBlob)
    });
    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100));
    }
  }

  return images;
};

/**
 * PDF에서 텍스트 추출
 */
export const extractTextFromPdf = async (file, onProgress) => {
  const pdfDoc = await loadPdfDocument(file);
  const numPages = pdfDoc.numPages;
  const textContent = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    textContent.push({
      pageNum: i,
      text: pageText
    });
    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100));
    }
  }

  return textContent;
};

/**
 * PDF 병합
 */
export const mergePdfs = async (files, onProgress) => {
  // Limit number of files to prevent DoS
  if (files.length > MAX_MERGE_FILES) {
    throw new Error(`Too many files to merge (${files.length}). Maximum allowed: ${MAX_MERGE_FILES}`);
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    const fileBytes = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const pageCount = pdf.getPageCount();

    // Check total page limit
    if (totalPages + pageCount > MAX_PAGES) {
      throw new Error(`Total pages exceed limit. Maximum allowed: ${MAX_PAGES}`);
    }

    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
    totalPages += pageCount;

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};

/**
 * PDF 분할 (페이지 범위별)
 */
export const splitPdf = async (file, ranges, onProgress) => {
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const results = [];

  for (let i = 0; i < ranges.length; i++) {
    const { start, end } = ranges[i];
    const newPdf = await PDFDocument.create();
    const pageIndices = [];

    for (let j = start - 1; j < end; j++) {
      pageIndices.push(j);
    }

    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    results.push({
      range: `${start}-${end}`,
      blob: new Blob([pdfBytes], { type: 'application/pdf' })
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / ranges.length) * 100));
    }
  }

  return results;
};

/**
 * PDF 특정 페이지 추출
 */
export const extractPages = async (file, pageNumbers, onProgress) => {
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  const pageIndices = pageNumbers.map(n => n - 1);
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);

  pages.forEach((page, idx) => {
    newPdf.addPage(page);
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / pages.length) * 100));
    }
  });

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

/**
 * PDF 특정 페이지 삭제
 */
export const deletePages = async (file, pageNumbersToDelete, onProgress) => {
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const totalPages = sourcePdf.getPageCount();

  const pagesToKeep = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!pageNumbersToDelete.includes(i)) {
      pagesToKeep.push(i - 1);
    }
  }

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pagesToKeep);

  pages.forEach((page, idx) => {
    newPdf.addPage(page);
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / pages.length) * 100));
    }
  });

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

/**
 * PDF 페이지 순서 변경
 */
export const reorderPages = async (file, newOrder, onProgress) => {
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  const pageIndices = newOrder.map(n => n - 1);
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);

  pages.forEach((page, idx) => {
    newPdf.addPage(page);
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / pages.length) * 100));
    }
  });

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

/**
 * PDF 페이지 회전
 */
export const rotatePages = async (file, rotations, onProgress) => {
  const fileBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(fileBytes);
  const pages = pdf.getPages();

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    if (rotations[pageNum]) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotations[pageNum]));
    }
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / pages.length) * 100));
    }
  });

  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

/**
 * PDF 페이지 수 가져오기
 */
export const getPdfPageCount = async (file) => {
  const fileBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(fileBytes);
  return pdf.getPageCount();
};

/**
 * PDF 페이지 썸네일 생성
 */
export const generateThumbnails = async (file, scale = 0.3, onProgress) => {
  const pdfDoc = await loadPdfDocument(file);
  const numPages = pdfDoc.numPages;

  // Limit pages to prevent DoS
  if (numPages > MAX_PAGES) {
    throw new Error(`PDF has too many pages (${numPages}). Maximum allowed: ${MAX_PAGES}`);
  }

  const thumbnails = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    thumbnails.push({
      pageNum: i,
      url: canvas.toDataURL('image/png')
    });

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100));
    }
  }

  return thumbnails;
};
