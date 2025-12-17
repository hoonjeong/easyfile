import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
