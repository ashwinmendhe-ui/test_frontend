import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import koCommon from "./locales/ko/common.json";
import enCommon from "./locales/en/common.json";

const resources = {
  ko: {
    translation: koCommon,
  },
  en: {
    translation: enCommon,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "ko", // default Korean
  fallbackLng: "ko",
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;