# EasyFile App - Development Guidelines

## Project Overview
EasyFile is a React + Vite based file conversion web application with multilingual support (Korean/English).

## Development Rules

### 1. New Feature Implementation Checklist
When adding a new feature, always complete the following:

- [ ] Create the component file (e.g., `src/pages/category/NewFeature.jsx`)
- [ ] Add route in `src/App.jsx`
- [ ] Add menu item in the corresponding index file (e.g., `DocumentIndex.jsx`, `ImageIndex.jsx`)
- [ ] **Add Korean translations** in `src/locales/ko.json`
- [ ] **Add English translations** in `src/locales/en.json`
- [ ] **Add CoupangBanner component** in the page (both top position)
- [ ] Ensure responsive design for mobile

### 2. Translation Keys Structure
```json
{
  "category": {
    "featureName": {
      "title": "Menu title",
      "description": "Short description for menu card",
      "pageTitle": "Page heading",
      "pageDescription": "Page subtitle",
      "seoKeywords": "comma, separated, keywords",
      // ... other feature-specific keys
    }
  }
}
```

### 3. CoupangBanner Usage
Always include CoupangBanner in new pages:
```jsx
import CoupangBanner from '../../components/CoupangBanner';

// In the component return:
<CoupangBanner type="top" />
```

### 4. Page Layout Pattern
Standard page structure:
```jsx
<>
  <SEOHead title={...} description={...} keywords={...} />

  <div className="page-header">
    <h1 className="page-title">{t('...')}</h1>
    <p className="page-description">{t('...')}</p>
  </div>

  <CoupangBanner type="top" />

  <div className="converter-card" style={{ padding: '20px', maxWidth: '100%' }}>
    {/* Main content */}
  </div>

  <div className="seo-content">
    {/* SEO content */}
  </div>
</>
```

### 5. Responsive Design
For split layouts (input/output), use:
```jsx
<div className="markdown-split-layout" style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  minHeight: '500px'
}}>
  {/* Content */}
</div>

<style>{`
  @media (max-width: 768px) {
    .markdown-split-layout {
      grid-template-columns: 1fr !important;
    }
    .markdown-split-layout > div {
      min-height: 300px;
    }
  }
`}</style>
```

### 6. Menu Order
Current menu order in Document category:
1. Markdown to Naver Blog
2. Markdown (to HTML)
3. Excel to JSON
4. LaTeX to Image

## Tech Stack
- **Framework**: React 19 + Vite 7
- **Routing**: react-router-dom
- **i18n**: i18next (Korean/English)
- **PDF**: pdf-lib, pdfjs-dist
- **Media**: @ffmpeg/ffmpeg
- **AI Background Removal**: @huggingface/transformers, onnxruntime-web

## File Structure
```
src/
├── components/          # Shared components
├── hooks/               # Custom hooks
├── locales/             # i18n translations
│   ├── ko.json          # Korean
│   └── en.json          # English
├── pages/
│   ├── Home.jsx
│   ├── image/           # Image converters
│   ├── pdf/             # PDF tools
│   ├── document/        # Document converters
│   ├── media/           # Media converters
│   └── chromakey/       # Chromakey/Background removal
├── styles/
│   └── global.css
├── App.jsx
├── main.jsx
└── i18n.js
```

## Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```
