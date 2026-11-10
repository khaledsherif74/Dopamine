import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  directionOf,
  pickInitialLang,
  translate,
  SUPPORTED_LANGS,
} from "./translate.js";
import { readString, writeString } from "../utils/storage.js";

const I18nContext = createContext(null);

export function I18nProvider({
  dictionaries,
  storageKey = "dopamine.lang",
  children,
}) {
  const [lang, setLangState] = useState(() =>
    pickInitialLang(
      readString(storageKey),
      typeof navigator !== "undefined" ? navigator.language : "en",
    ),
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = directionOf(lang);
  }, [lang]);

  const setLang = useCallback(
    (next) => {
      if (!SUPPORTED_LANGS.includes(next)) return;
      writeString(storageKey, next);
      setLangState(next);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      lang,
      dir: directionOf(lang),
      setLang,
      t: (key, params) => translate(dictionaries, lang, key, params),
    }),
    [dictionaries, lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
