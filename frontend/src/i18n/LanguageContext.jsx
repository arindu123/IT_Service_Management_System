/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, translations } from "./translations";

const STORAGE_KEY = "appLanguage";
const LanguageContext = createContext(null);

const englishLookup = buildEnglishLookup(translations.en);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getInitialLanguage());

  const languageConfig = useMemo(
    () => LANGUAGES.find((item) => item.code === language) || LANGUAGES[0],
    [language]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (translations[nextLanguage]) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key, params) => translateKey(language, key, params),
    [language]
  );

  const enumLabel = useCallback(
    (group, value) => {
      if (!value) return "";
      return translateKey(language, `enums.${group}.${value}`) || humanize(value);
    },
    [language]
  );

  const message = useCallback(
    (text) => translateMessage(language, text),
    [language]
  );

  const formatDate = useCallback(
    (value, options = {}) => formatDateValue(value, languageConfig.locale, language, options),
    [language, languageConfig.locale]
  );

  const formatDateTime = useCallback(
    (value, options = {}) =>
      formatDateValue(value, languageConfig.locale, language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
      }),
    [language, languageConfig.locale]
  );

  const formatNumber = useCallback(
    (value) => new Intl.NumberFormat(languageConfig.locale).format(Number(value) || 0),
    [languageConfig.locale]
  );

  const value = useMemo(
    () => ({
      language,
      languageConfig,
      languages: LANGUAGES,
      setLanguage,
      t,
      enumLabel,
      message,
      formatDate,
      formatDateTime,
      formatNumber,
    }),
    [enumLabel, formatDate, formatDateTime, formatNumber, language, languageConfig, message, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used inside LanguageProvider");
  }

  return context;
}

export function translateKey(language, key, params) {
  const value = getNestedValue(translations[language], key) ?? getNestedValue(translations.en, key) ?? key;
  return typeof value === "string" ? applyParams(value, params) : key;
}

export function translateMessage(language, text) {
  if (!text || language === DEFAULT_LANGUAGE) return text;

  const key = englishLookup.get(text);
  return key ? translateKey(language, key) : text;
}

function getInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored && translations[stored]) return stored;

  const browserLanguage = navigator.language?.slice(0, 2);
  return translations[browserLanguage] ? browserLanguage : DEFAULT_LANGUAGE;
}

function getNestedValue(source, key) {
  return key.split(".").reduce((current, part) => current?.[part], source);
}

function applyParams(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

function formatDateValue(value, locale, language, options = {}) {
  if (!value) return translateKey(language, "common.notAvailable");

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return translateKey(language, "common.notAvailable");

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

function humanize(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildEnglishLookup(source, prefix = "") {
  const lookup = new Map();

  Object.entries(source).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      lookup.set(value, path);
      return;
    }

    if (value && typeof value === "object") {
      buildEnglishLookup(value, path).forEach((nestedPath, nestedValue) => {
        lookup.set(nestedValue, nestedPath);
      });
    }
  });

  return lookup;
}
