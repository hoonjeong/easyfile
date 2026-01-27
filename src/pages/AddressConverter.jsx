import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/SEOHead';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  SITE_PRESETS,
  parseDetailAddress,
  translateDetailAddress,
  convertAddress,
  openKakaoPostcode,
  validatePccc,
  romanizeKoreanName,
  containsKorean,
} from '../utils/addressConverter';

const AddressConverter = () => {
  const { t } = useTranslation();

  // State
  const [koreanAddress, setKoreanAddress] = useState(null);
  const [detailAddress, setDetailAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [nameInputMode, setNameInputMode] = useState('korean'); // 'korean' or 'english'
  const [phone, setPhone] = useState('');
  const [savedPccc, setSavedPccc] = useLocalStorage('jikgupass-pccc', '');
  const [savePcccEnabled, setSavePcccEnabled] = useLocalStorage('jikgupass-save-pccc', false);
  const [pccc, setPccc] = useState('');
  const [shoppingSite, setShoppingSite] = useState('amazon');

  // Load saved PCCC on mount if auto-save is enabled
  useEffect(() => {
    if (savePcccEnabled && savedPccc) {
      setPccc(savedPccc);
    }
  }, []);
  const [convertedAddress, setConvertedAddress] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Romanized name preview (for Korean input mode)
  const romanizedName = nameInputMode === 'korean' && containsKorean(userName)
    ? romanizeKoreanName(userName)
    : null;

  // Detail address preview
  const parsedDetail = parseDetailAddress(detailAddress);
  const detailPreview = translateDetailAddress(parsedDetail.dong, parsedDetail.ho);

  // Handle address search
  const handleSearchAddress = useCallback(async () => {
    setError('');
    try {
      await openKakaoPostcode((data) => {
        setKoreanAddress(data);
        setConvertedAddress(null);
      });
      setScriptLoaded(true);
    } catch (err) {
      console.error('Kakao Postcode error:', err);
      setError(t('address.error.loadScript'));
    }
  }, [t]);

  // Handle conversion
  const handleConvert = useCallback(() => {
    setError('');

    if (!koreanAddress) {
      setError(t('address.error.noAddress'));
      return;
    }

    if (!userName.trim()) {
      setError(t('address.error.noName'));
      return;
    }

    // Determine the final name to use
    let finalName = userName.trim();
    if (nameInputMode === 'korean' && containsKorean(userName)) {
      const romanized = romanizeKoreanName(userName);
      finalName = romanized.fullName;
    }

    const result = convertAddress({
      koreanAddress,
      detailAddress,
      userName: finalName,
      phone,
      pccc,
      sitePreset: shoppingSite,
    });

    setConvertedAddress(result);
  }, [koreanAddress, detailAddress, userName, nameInputMode, phone, pccc, shoppingSite, t]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${fieldName} ${t('address.copied')}`);
    } catch (err) {
      console.error('Copy failed:', err);
      setToast(t('address.copyFailed'));
    }
  }, [t]);

  // Clear toast after delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Copy all fields
  const handleCopyAll = useCallback(async () => {
    if (!convertedAddress) return;

    const preset = SITE_PRESETS[shoppingSite];
    const lines = [];

    if (preset.nameFormat === 'fullName') {
      lines.push(`Full Name: ${convertedAddress.fullName}`);
    } else {
      lines.push(`First Name: ${convertedAddress.firstName}`);
      lines.push(`Last Name: ${convertedAddress.lastName}`);
    }

    lines.push(`Address Line 1: ${convertedAddress.addressLine1}`);
    if (convertedAddress.addressLine2) {
      lines.push(`Address Line 2: ${convertedAddress.addressLine2}`);
    }
    lines.push(`City: ${convertedAddress.city}`);
    lines.push(`State/Province: ${convertedAddress.state}`);
    lines.push(`Zip Code: ${convertedAddress.zipCode}`);
    lines.push(`Country: ${convertedAddress.country}`);
    lines.push(`Phone: ${convertedAddress.phone}`);

    if (preset.showPccc && convertedAddress.pccc) {
      lines.push(`PCCC: ${convertedAddress.pccc}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToast(t('address.copied'));
    } catch (err) {
      console.error('Copy all failed:', err);
      setToast(t('address.copyFailed'));
    }
  }, [convertedAddress, shoppingSite, t]);

  // Render result field
  const renderResultField = (label, value, warning = false, maxLength = null) => {
    if (!value) return null;

    return (
      <div className="address-result-field">
        <div className="address-result-field-content">
          <div className="address-result-field-label">{label}</div>
          <div className="address-result-field-value">{value}</div>
          {warning && maxLength && (
            <div className="address-result-field-warning">
              {t('address.warning.tooLong', { current: value.length, max: maxLength })}
            </div>
          )}
        </div>
        <button
          className="address-copy-button"
          onClick={() => handleCopy(value, label)}
          title={`Copy ${label}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    );
  };

  const preset = SITE_PRESETS[shoppingSite];

  return (
    <>
      <SEOHead
        title={t('address.pageTitle')}
        description={t('address.pageDescription')}
        keywords={t('address.seoKeywords')}
      />

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('address.title')}</h1>
        <p className="page-description">{t('address.description')}</p>
      </div>

      {/* Main Converter Card */}
      <div className="converter-card">
        {/* Shopping Site Selector */}
        <div className="address-section">
          <label className="address-label">{t('address.shoppingSite')}</label>
          <div className="address-site-selector">
            {Object.entries(SITE_PRESETS).map(([key, site]) => (
              <button
                key={key}
                className={`address-site-button ${shoppingSite === key ? 'active' : ''}`}
                onClick={() => {
                  setShoppingSite(key);
                  setConvertedAddress(null);
                }}
              >
                {t(`address.sites.${key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Address Search */}
        <div className="address-section">
          <label className="address-label">{t('address.searchAddress')}</label>
          <button
            className="address-search-button"
            onClick={handleSearchAddress}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {t('address.clickToSearch')}
          </button>

          {koreanAddress && (
            <div className="address-preview">
              <div className="address-preview-label">{t('address.selectedAddress')}</div>
              <div className="address-preview-korean">{koreanAddress.roadAddress}</div>
              <div className="address-preview-english">{koreanAddress.englishAddress}</div>
              <div className="address-preview-zip">{koreanAddress.zonecode}</div>
            </div>
          )}
        </div>

        {/* Detail Address */}
        <div className="address-section">
          <label className="address-label">{t('address.detailAddress')}</label>
          <input
            type="text"
            className="address-input"
            placeholder={t('address.detailPlaceholder')}
            value={detailAddress}
            onChange={(e) => {
              setDetailAddress(e.target.value);
              setConvertedAddress(null);
            }}
          />
          {detailPreview && (
            <div className="address-detail-preview">
              <span className="address-detail-preview-label">{t('address.detailPreview')}:</span>
              <span className="address-detail-preview-value">{detailPreview}</span>
            </div>
          )}
        </div>

        {/* User Name */}
        <div className="address-section">
          <label className="address-label">{t('address.userName')}</label>
          <div className="address-name-mode-selector">
            <button
              className={`address-name-mode-button ${nameInputMode === 'korean' ? 'active' : ''}`}
              onClick={() => {
                setNameInputMode('korean');
                setUserName('');
                setConvertedAddress(null);
              }}
            >
              {t('address.nameMode.korean')}
            </button>
            <button
              className={`address-name-mode-button ${nameInputMode === 'english' ? 'active' : ''}`}
              onClick={() => {
                setNameInputMode('english');
                setUserName('');
                setConvertedAddress(null);
              }}
            >
              {t('address.nameMode.english')}
            </button>
          </div>
          <input
            type="text"
            className="address-input"
            placeholder={nameInputMode === 'korean'
              ? t('address.userNamePlaceholderKorean')
              : t('address.userNamePlaceholderEnglish')}
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setConvertedAddress(null);
            }}
          />
          {romanizedName && (
            <div className="address-name-preview">
              <span className="address-name-preview-label">{t('address.namePreview')}:</span>
              <span className="address-name-preview-value">{romanizedName.fullName}</span>
              <span className="address-name-preview-detail">
                (First: {romanizedName.firstName}, Last: {romanizedName.lastName})
              </span>
            </div>
          )}
          <div className="address-help">
            {nameInputMode === 'korean'
              ? t('address.userNameHelpKorean')
              : t('address.userNameHelp')}
          </div>
        </div>

        {/* Phone */}
        <div className="address-section">
          <label className="address-label">{t('address.phone')}</label>
          <input
            type="tel"
            className="address-input"
            placeholder={t('address.phonePlaceholder')}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setConvertedAddress(null);
            }}
          />
        </div>

        {/* PCCC */}
        <div className="address-section">
          <label className="address-label">
            {t('address.pccc')}
          </label>
          <input
            type="text"
            className="address-input"
            placeholder={t('address.pcccPlaceholder')}
            value={pccc}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setPccc(value);
              setConvertedAddress(null);
              // Save to localStorage if auto-save is enabled and valid
              if (savePcccEnabled && validatePccc(value)) {
                setSavedPccc(value);
              }
            }}
            maxLength={13}
          />
          <label className="address-checkbox-label">
            <input
              type="checkbox"
              checked={savePcccEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setSavePcccEnabled(checked);
                if (checked && validatePccc(pccc)) {
                  setSavedPccc(pccc);
                } else if (!checked) {
                  setSavedPccc('');
                }
              }}
            />
            <span>{t('address.pcccAutoSave')}</span>
          </label>
          <div className="address-help">{t('address.pcccHelp')}</div>
          {pccc && !validatePccc(pccc) && (
            <div className="address-pccc-invalid">{t('address.pcccInvalid')}</div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Convert Button */}
        <button
          className="convert-button"
          onClick={handleConvert}
        >
          {t('address.convert')}
        </button>

        {/* Results */}
        {convertedAddress && (
          <div className="address-result">
            <div className="address-result-header">
              <h3 className="address-result-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {t('address.result')} - {preset.name}
              </h3>
              <button
                className="address-copy-all-button"
                onClick={handleCopyAll}
              >
                {t('address.copyAll')}
              </button>
            </div>

            <div className="address-result-fields">
              {preset.nameFormat === 'fullName' ? (
                renderResultField(t('address.fields.fullName'), convertedAddress.fullName)
              ) : (
                <>
                  {renderResultField(t('address.fields.firstName'), convertedAddress.firstName)}
                  {renderResultField(t('address.fields.lastName'), convertedAddress.lastName)}
                </>
              )}

              {renderResultField(
                t('address.fields.addressLine1'),
                convertedAddress.addressLine1,
                convertedAddress.addressLine1Warning,
                preset.addressLine1Max
              )}

              {renderResultField(
                t('address.fields.addressLine2'),
                convertedAddress.addressLine2,
                convertedAddress.addressLine2Warning,
                preset.addressLine2Max
              )}

              {renderResultField(t('address.fields.city'), convertedAddress.city)}
              {renderResultField(t('address.fields.state'), convertedAddress.state)}
              {renderResultField(t('address.fields.zipCode'), convertedAddress.zipCode)}
              {renderResultField(t('address.fields.country'), convertedAddress.country)}
              {renderResultField(t('address.fields.phone'), convertedAddress.phone)}

              {preset.showPccc && convertedAddress.pccc && (
                renderResultField(t('address.fields.pccc'), convertedAddress.pccc)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="address-tips">
        <h3 className="address-tips-title">{t('address.tips.title')}</h3>
        <ul className="address-tips-list">
          <li>{t('address.tips.tip1')}</li>
          <li>{t('address.tips.tip2')}</li>
          <li>{t('address.tips.tip3')}</li>
          <li>{t('address.tips.tip4')}</li>
        </ul>
      </div>

      {/* SEO Content */}
      <div className="seo-content">
        <h2>{t('address.whatIs')}</h2>
        <p>{t('address.whatIsDesc')}</p>

        <h2>{t('address.whyUse')}</h2>
        <ul>
          <li><strong>{t('address.features.siteOptimized')}</strong></li>
          <li><strong>{t('address.features.smartDetail')}</strong></li>
          <li><strong>{t('address.features.autoAbbr')}</strong></li>
          <li><strong>{t('address.features.pcccSave')}</strong></li>
          <li><strong>{t('address.features.oneCopy')}</strong></li>
        </ul>
      </div>

      {/* Toast */}
      {toast && (
        <div className="address-toast">
          {toast}
        </div>
      )}
    </>
  );
};

export default AddressConverter;
