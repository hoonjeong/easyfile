import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import * as XLSX from 'xlsx';

const ExcelConverter = () => {
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

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      setProgress(60);

      let outputData;
      let mimeType;
      let extension;
      let previewText;

      switch (outputFormat) {
        case 'json':
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          outputData = JSON.stringify(jsonData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          previewText = outputData.slice(0, 1000) + (outputData.length > 1000 ? '\n...' : '');
          break;

        case 'csv':
          outputData = XLSX.utils.sheet_to_csv(worksheet);
          mimeType = 'text/csv';
          extension = 'csv';
          previewText = outputData.slice(0, 1000) + (outputData.length > 1000 ? '\n...' : '');
          break;

        case 'html':
          outputData = XLSX.utils.sheet_to_html(worksheet);
          mimeType = 'text/html';
          extension = 'html';
          previewText = '(HTML 테이블 생성 완료)';
          break;

        default:
          throw new Error('지원하지 않는 출력 형식입니다.');
      }

      setProgress(90);

      const blob = new Blob([outputData], { type: mimeType });
      setResult(blob);
      setPreview(previewText);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Excel 파일 변환 중 오류가 발생했습니다. 올바른 Excel 파일인지 확인해주세요.');
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
      <SEOHead
        title="Excel JSON CSV 변환 - 엑셀 변환기"
        description="Excel 파일을 JSON, CSV, HTML로 무료 변환. 엑셀 데이터를 개발용 JSON이나 웹용 HTML 테이블로 변환하세요. 서버 업로드 없이 안전하게 변환됩니다."
        keywords="Excel 변환, 엑셀 JSON 변환, Excel CSV 변환, 엑셀 HTML 변환, xlsx 변환, xls 변환, 온라인 엑셀 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">Excel to JSON/CSV/HTML 변환기</h1>
        <p className="page-description">
          Excel 파일을 JSON, CSV, HTML로 변환하세요.
          개발용 데이터나 웹용 테이블로 쉽게 변환할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.xlsx', '.xls', '.csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              onRemove={handleRemoveFile}
            />

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                변환 옵션
              </h4>

              <div className="option-group">
                <label className="option-label">출력 형식</label>
                <select
                  className="option-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <option value="json">JSON (개발용 데이터)</option>
                  <option value="csv">CSV (범용 스프레드시트)</option>
                  <option value="html">HTML (웹 테이블)</option>
                </select>
              </div>
            </div>

            {converting && <ProgressBar progress={progress} />}

            {error && (
              <div className="error">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {preview && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#1E293B',
                borderRadius: '8px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre style={{
                  color: '#E2E8F0',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {preview}
                </pre>
              </div>
            )}

            {result && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  변환 완료!
                </h4>
                <button className="download-button" onClick={handleDownload}>
                  {getFormatLabel()} 파일 다운로드
                </button>
              </div>
            )}

            {!result && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                {getFormatLabel()}로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>Excel 변환이 필요한 경우</h2>
        <ul>
          <li><strong>JSON 변환</strong> - 웹 개발, API 데이터로 사용할 때</li>
          <li><strong>CSV 변환</strong> - 다른 프로그램과 데이터를 공유할 때</li>
          <li><strong>HTML 변환</strong> - 웹페이지에 테이블을 삽입할 때</li>
        </ul>

        <h2>지원하는 파일 형식</h2>
        <p>
          .xlsx (Excel 2007+), .xls (Excel 97-2003), .csv 파일을 지원합니다.
          첫 번째 시트의 데이터가 변환됩니다.
        </p>

        <h2>보안</h2>
        <p>
          모든 변환은 브라우저에서 처리되며, 파일이 서버로 전송되지 않습니다.
          민감한 비즈니스 데이터도 안전하게 변환할 수 있습니다.
        </p>
      </div>
    </>
  );
};

export default ExcelConverter;
