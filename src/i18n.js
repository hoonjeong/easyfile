import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko.json';
import en from './locales/en.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en }
};

/**
 * Custom language detector that:
 * 1. First checks localStorage for user's saved preference
 * 2. If no saved preference, checks browser language
 * 3. Returns 'ko' for Korean browsers, 'en' for all others
 */
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    // First, check if user has explicitly saved a preference
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
      return savedLang;
    }

    // No saved preference - detect from browser
    const browserLang = navigator.language || navigator.userLanguage;

    // If browser language starts with 'ko', user is likely in Korea
    if (browserLang && browserLang.toLowerCase().startsWith('ko')) {
      return 'ko';
    }

    // For all other regions, default to English
    return 'en';
  },
  cacheUserLanguage(lng) {
    // Save user's language choice to localStorage
    localStorage.setItem('i18nextLng', lng);
  }
};

// Create custom language detector instance
const languageDetector = new LanguageDetector();
languageDetector.addDetector(customLanguageDetector);

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',  // Default to English for non-Korean regions
    supportedLngs: ['ko', 'en'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['customDetector'],  // Use our custom detector
      caches: ['localStorage']     // Cache to localStorage
    }
  });

export default i18n;
