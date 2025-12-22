import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import Home from './pages/Home';

// Image converters
import ImageIndex from './pages/image/ImageIndex';
import HeicConverter from './pages/image/HeicConverter';
import WebpConverter from './pages/image/WebpConverter';
import PsdConverter from './pages/image/PsdConverter';
import TiffConverter from './pages/image/TiffConverter';
import SvgConverter from './pages/image/SvgConverter';
import IcoConverter from './pages/image/IcoConverter';

// Document converters
import DocumentIndex from './pages/document/DocumentIndex';
import ExcelConverter from './pages/document/ExcelConverter';
import MarkdownConverter from './pages/document/MarkdownConverter';
import LatexConverter from './pages/document/LatexConverter';

// Media converters
import MediaIndex from './pages/media/MediaIndex';
import AudioConverter from './pages/media/AudioConverter';
import VideoConverter from './pages/media/VideoConverter';
import GifConverter from './pages/media/GifConverter';

// PDF tools
import PdfIndex from './pages/pdf/PdfIndex';
import PdfToImage from './pages/pdf/PdfToImage';
import PdfToText from './pages/pdf/PdfToText';
import PdfMerge from './pages/pdf/PdfMerge';
import PdfSplit from './pages/pdf/PdfSplit';
import PdfExtract from './pages/pdf/PdfExtract';
import PdfDelete from './pages/pdf/PdfDelete';
import PdfReorder from './pages/pdf/PdfReorder';
import PdfRotate from './pages/pdf/PdfRotate';
import PdfCompress from './pages/pdf/PdfCompress';

// Image compressor
import ImageCompress from './pages/image/ImageCompress';

// Address converter
import AddressConverter from './pages/AddressConverter';

import './styles/global.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Image converters */}
            <Route path="/image" element={<ImageIndex />} />
            <Route path="/image/heic-to-jpg" element={<HeicConverter />} />
            <Route path="/image/webp-to-jpg" element={<WebpConverter />} />
            <Route path="/image/psd-to-jpg" element={<PsdConverter />} />
            <Route path="/image/tiff-to-jpg" element={<TiffConverter />} />
            <Route path="/image/svg-to-png" element={<SvgConverter />} />
            <Route path="/image/ico-to-png" element={<IcoConverter />} />
            <Route path="/image/compress" element={<ImageCompress />} />

            {/* Document converters */}
            <Route path="/document" element={<DocumentIndex />} />
            <Route path="/document/excel-to-json" element={<ExcelConverter />} />
            <Route path="/document/markdown-to-html" element={<MarkdownConverter />} />
            <Route path="/document/latex-to-image" element={<LatexConverter />} />

            {/* Media converters */}
            <Route path="/media" element={<MediaIndex />} />
            <Route path="/media/m4a-to-mp3" element={<AudioConverter />} />
            <Route path="/media/webm-to-mp4" element={<VideoConverter />} />
            <Route path="/media/gif-to-mp4" element={<GifConverter />} />

            {/* PDF tools */}
            <Route path="/pdf" element={<PdfIndex />} />
            <Route path="/pdf/pdf-to-image" element={<PdfToImage />} />
            <Route path="/pdf/pdf-to-text" element={<PdfToText />} />
            <Route path="/pdf/merge" element={<PdfMerge />} />
            <Route path="/pdf/split" element={<PdfSplit />} />
            <Route path="/pdf/extract" element={<PdfExtract />} />
            <Route path="/pdf/delete" element={<PdfDelete />} />
            <Route path="/pdf/reorder" element={<PdfReorder />} />
            <Route path="/pdf/rotate" element={<PdfRotate />} />
            <Route path="/pdf/compress" element={<PdfCompress />} />

            {/* Address converter */}
            <Route path="/address" element={<AddressConverter />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
