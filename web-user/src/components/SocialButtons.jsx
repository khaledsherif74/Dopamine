import { useEffect, useRef, useState } from "react";
import { Button, Spinner, useI18n, useTheme } from "@dopamine/web-shared";
import { config } from "@/config.js";
import { loadScript } from "@/lib/loadScript.js";
import { applePayload, googlePayload } from "@/features/auth/oauthPayload.js";

const GOOGLE_SRC = "https://accounts.google.com/gsi/client";
const APPLE_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

export function SocialButtons({ onPayload, onError, disabled }) {
  const { t } = useI18n();
  if (!config.googleClientId && !config.appleClientId) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="h-px flex-1 bg-border" />
        {t("auth.continueWith")}
        <span className="h-px flex-1 bg-border" />
      </div>
      {config.googleClientId ? (
        <GoogleButton onPayload={onPayload} onError={onError} />
      ) : null}
      {config.appleClientId ? (
        <AppleButton
          onPayload={onPayload}
          onError={onError}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function GoogleButton({ onPayload, onError }) {
  const { t, lang } = useI18n();
  const { resolved } = useTheme();
  const holder = useRef(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onPayload, onError });
  useEffect(() => {
    handlers.current = { onPayload, onError };
  });

  useEffect(() => {
    let cancelled = false;
    loadScript(GOOGLE_SRC)
      .then(() => {
        if (cancelled || !holder.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => {
            const payload = googlePayload(response);
            if (payload) handlers.current.onPayload(payload);
            else handlers.current.onError?.();
          },
        });
        holder.current.innerHTML = "";
        window.google.accounts.id.renderButton(holder.current, {
          theme: resolved === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          locale: lang,
          width: holder.current.offsetWidth || 320,
        });
        setReady(true);
      })
      .catch(() => handlers.current.onError?.());
    return () => {
      cancelled = true;
    };
  }, [lang, resolved]);

  return (
    <div
      className="flex min-h-[44px] items-center justify-center"
      aria-label={t("auth.google")}
    >
      <div ref={holder} className="w-full" />
      {!ready ? <Spinner size={20} label={t("common.loading")} /> : null}
    </div>
  );
}

let appleInitialised = false;
function AppleButton({ onPayload, onError, disabled }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      await loadScript(APPLE_SRC);
      if (!appleInitialised) {
        window.AppleID.auth.init({
          clientId: config.appleClientId,
          scope: "name email",
          redirectURI: config.appleRedirectUri,
          usePopup: true,
        });
        appleInitialised = true;
      }
      const result = await window.AppleID.auth.signIn();
      const payload = applePayload(result);
      if (payload) onPayload(payload);
      else onError?.();
    } catch (err) {
      if (
        err?.error !== "popup_closed_by_user" &&
        err?.error !== "user_cancelled_authorize"
      )
        onError?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full rounded-full!"
      loading={busy}
      disabled={disabled}
      onClick={signIn}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.9.9-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4z" />
      </svg>
      {t("auth.apple")}
    </Button>
  );
}
