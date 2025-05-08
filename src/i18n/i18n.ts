
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './en.json';
import esTranslation from './es.json';
import frTranslation from './fr.json';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      es: {
        translation: esTranslation
      },
      fr: {
        translation: frTranslation
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
