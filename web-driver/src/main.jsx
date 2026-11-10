import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider, ThemeProvider } from "@dopamine/web-shared";
import "./index.css";
import App from "./App.jsx";
import { store } from "./store.js";
import { bootstrapAuth } from "./lib/session.js";
import { dictionaries } from "./i18n/index.js";

store.dispatch(bootstrapAuth());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <I18nProvider
        dictionaries={dictionaries}
        storageKey="dopamine.driver.lang"
      >
        <ThemeProvider storageKey="dopamine.driver.theme">
          <BrowserRouter basename="/driver">
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </I18nProvider>
    </Provider>
  </StrictMode>,
);
