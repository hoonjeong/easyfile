import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';

const PdfIndex = () => {
  const { t } = useTranslation();

  const converters = [
    {
      path: '/pdf/pdf-to-image',
      titleKey: 'pdf.toImage.title',
      descriptionKey: 'pdf.toImage.description',
      tags: ['PDF', 'JPG', 'PNG', 'Image'],
      icon: '🖼️'
    },
    {
      path: '/pdf/pdf-to-text',
      titleKey: 'pdf.toText.title',
      descriptionKey: 'pdf.toText.description',
      tags: ['PDF', 'Text', 'Extract'],
      icon: '📝'
    },
    {
      path: '/pdf/merge',
      titleKey: 'pdf.merge.title',
      descriptionKey: 'pdf.merge.description',
      tags: ['Merge', 'Combine'],
      icon: '📑'
    },
    {
      path: '/pdf/split',
      titleKey: 'pdf.split.title',
      descriptionKey: 'pdf.split.description',
      tags: ['Split', 'Divide'],
      icon: '✂️'
    },
    {
      path: '/pdf/extract',
      titleKey: 'pdf.extract.title',
      descriptionKey: 'pdf.extract.description',
      tags: ['Extract', 'Pages'],
      icon: '📄'
    },
    {
      path: '/pdf/delete',
      titleKey: 'pdf.delete.title',
      descriptionKey: 'pdf.delete.description',
      tags: ['Delete', 'Remove'],
      icon: '🗑️'
    },
    {
      path: '/pdf/reorder',
      titleKey: 'pdf.reorder.title',
      descriptionKey: 'pdf.reorder.description',
      tags: ['Reorder', 'Sort'],
      icon: '🔀'
    },
    {
      path: '/pdf/rotate',
      titleKey: 'pdf.rotate.title',
      descriptionKey: 'pdf.rotate.description',
      tags: ['Rotate', '90°'],
      icon: '🔄'
    },
    {
      path: '/pdf/compress',
      titleKey: 'pdf.compress.title',
      descriptionKey: 'pdf.compress.description',
      tags: ['Compress', 'Reduce'],
      icon: '📦'
    }
  ];

  return (
    <>
      <SEOHead
        title={t('pdf.seoTitle')}
        description={t('pdf.seoDescription')}
        keywords="PDF converter, PDF merge, PDF split, PDF edit, PDF to JPG, PDF to PNG, PDF text extract, online PDF tools"
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.pageTitle')}</h1>
        <p className="page-description">{t('pdf.pageDescription')}</p>
      </div>

      <div className="categories" style={{ marginTop: '20px' }}>
        {converters.map((converter) => (
          <Link
            key={converter.path}
            to={converter.path}
            className="category-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="category-icon pdf">
              {converter.icon}
            </div>
            <h3 className="category-title">{t(converter.titleKey)}</h3>
            <p className="category-description">{t(converter.descriptionKey)}</p>
            <div className="converter-list">
              {converter.tags.map((tag) => (
                <span key={tag} className="converter-tag">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.features.title')}</h2>
        <ul>
          <li><strong>{t('pdf.features.free')}</strong></li>
          <li><strong>{t('pdf.features.secure')}</strong></li>
          <li><strong>{t('pdf.features.fast')}</strong></li>
          <li><strong>{t('pdf.features.various')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfIndex;
