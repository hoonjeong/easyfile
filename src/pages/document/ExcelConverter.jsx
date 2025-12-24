import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultDisplay from '../../components/ResultDisplay';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import ExcelJS from 'exceljs';
import DOMPurify from 'dompurify';
import CoupangBanner from '../../components/CoupangBanner';

const ExcelConverter = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('json');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Sanitize cell value to prevent XSS
   */
  const sanitizeCellValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Handle rich text, dates, etc.
      if (value.result !== undefined) return String(value.result);
      if (value.text) return String(value.text);
      if (value instanceof Date) return value.toISOString();
      return JSON.stringify(value);
    }
    return String(value);
  };

  /**
   * Convert worksheet to JSON with sanitization
   */
  const worksheetToJson = (worksheet) => {
    const data = [];
    const headers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row as headers
        row.eachCell((cell) => {
          headers.push(sanitizeCellValue(cell.value));
        });
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1] || `Column${colNumber}`;
          rowData[header] = sanitizeCellValue(cell.value);
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });

    return data;
  };

  /**
   * Convert worksheet to CSV with sanitization
   */
  const worksheetToCsv = (worksheet) => {
    const rows = [];

    worksheet.eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        let value = sanitizeCellValue(cell.value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        cells.push(value);
      });
      rows.push(cells.join(','));
    });

    return rows.join('\n');
  };

  /**
   * Convert worksheet to HTML with sanitization
   */
  const worksheetToHtml = (worksheet) => {
    let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">\n';

    worksheet.eachRow((row, rowNumber) => {
      html += '  <tr>\n';
      row.eachCell({ includeEmpty: true }, (cell) => {
        const tag = rowNumber === 1 ? 'th' : 'td';
        // Sanitize cell content to prevent XSS
        const value = DOMPurify.sanitize(sanitizeCellValue(cell.value));
        html += `    <${tag}>${value}</${tag}>\n`;
      });
      html += '  </tr>\n';
    });

    html += '</table>';
    return html;
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      const workbook = new ExcelJS.Workbook();
      const fileName = file.name.toLowerCase();

      // Determine file type and load accordingly
      if (fileName.endsWith('.csv')) {
        // For CSV files, read as text and parse manually
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const worksheet = workbook.addWorksheet('Sheet1');

        lines.forEach((line, rowIndex) => {
          // Simple CSV parsing (handles basic cases)
          const cells = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());

          worksheet.addRow(cells);
        });
      } else {
        await workbook.xlsx.load(arrayBuffer);
      }

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error(t('document.excel.noWorksheet'));
      }

      setProgress(60);

      let outputData;
      let mimeType;
      let extension;
      let previewText;

      switch (outputFormat) {
        case 'json': {
          const jsonData = worksheetToJson(worksheet);
          outputData = JSON.stringify(jsonData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          previewText = outputData.slice(0, 1000) + (outputData.length > 1000 ? '\n...' : '');
          break;
        }

        case 'csv': {
          outputData = worksheetToCsv(worksheet);
          mimeType = 'text/csv';
          extension = 'csv';
          previewText = outputData.slice(0, 1000) + (outputData.length > 1000 ? '\n...' : '');
          break;
        }

        case 'html': {
          outputData = worksheetToHtml(worksheet);
          mimeType = 'text/html';
          extension = 'html';
          previewText = t('document.excel.htmlComplete');
          break;
        }

        default:
          throw new Error(t('document.excel.unsupportedFormat'));
      }

      setProgress(90);

      const blob = new Blob([outputData], { type: mimeType });
      setResult(blob);
      setPreview(previewText);
      setProgress(100);
    } catch (err) {
      console.error('Excel conversion error:', err);
      setError(t('document.excel.error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, outputFormat === 'json' ? 'json' : outputFormat === 'csv' ? 'csv' : 'html');
    downloadFile(result, filename);
  };

  const getFormatLabel = () => {
    switch (outputFormat) {
      case 'json': return 'JSON';
      case 'csv': return 'CSV';
      case 'html': return 'HTML';
      default: return outputFormat.toUpperCase();
    }
  };

  return (
    <>
      <SEOHead title={t('document.excel.pageTitle')} description={t('document.excel.pageDescription')} keywords={t('document.excel.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('document.excel.pageTitle')}</h1>
        <p className="page-description">{t('document.excel.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.xlsx', '.xls', '.csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']} fileCategory="excel" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('common.outputFormat')}</label>
                <select className="option-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  <option value="json">{t('document.excel.jsonOption')}</option>
                  <option value="csv">{t('document.excel.csvOption')}</option>
                  <option value="html">{t('document.excel.htmlOption')}</option>
                </select>
              </div>
            </div>

            {converting && <ProgressBar progress={progress} />}
            <ErrorDisplay error={error} />

            {preview && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#1E293B', borderRadius: '8px', maxHeight: '200px', overflow: 'auto' }}>
                <pre style={{ color: '#E2E8F0', fontSize: '12px', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{preview}</pre>
              </div>
            )}

            <ResultDisplay
              result={result}
              onDownload={handleDownload}
              downloadLabel={t('document.downloadFormat', { format: getFormatLabel() })}
            />

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{t('document.convertToFormat', { format: getFormatLabel() })}</button>
            )}
          </>
        )}
      </div>

      <CoupangBanner type="bottom" />

      <div className="seo-content">
        <h2>{t('document.excel.whatIs')}</h2>
        <p>{t('document.excel.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
          <li><strong>{t('whyUse.quality')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default ExcelConverter;
