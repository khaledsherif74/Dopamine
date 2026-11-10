import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorView,
  LoadingView,
  TextField,
  apiErrorMessage,
  useI18n,
} from "@dopamine/web-shared";
import {
  useGetMeQuery,
  useSetAvailabilityMutation,
  useUpdateMeMutation,
} from "@/api/endpoints.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import {
  profileFormFrom,
  validateDriverProfile,
} from "@/features/profile/profileForm.js";
import { availabilityBody } from "@/features/geo/location.js";
import { usePosition } from "@/features/geo/usePosition.jsx";

function LocationCard({ me }) {
  const { t } = useI18n();
  const { position, errorKey, locate, markSent } = usePosition();
  const [setAvailability] = useSetAvailabilityMutation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setBusy(true);
    setMessage("");
    const fix = await locate();
    if (fix && me.isOnline) {
      try {
        await setAvailability(availabilityBody(true, fix)).unwrap();
        markSent(fix);
        setMessage(t("profile.locationSent"));
      } catch (err) {
        setMessage(apiErrorMessage(err, t));
      }
    }
    setBusy(false);
  }

  return (
    <Card className="space-y-2 p-4">
      <h2 className="text-lg font-semibold">{t("profile.location")}</h2>
      <p className="text-sm text-text-secondary">{t("profile.locationHelp")}</p>
      <p className="text-sm text-text-primary" dir="ltr">
        {position
          ? `${position.lat}, ${position.lng}`
          : me.lat != null
            ? `${me.lat}, ${me.lng}`
            : t("profile.noLocation")}
      </p>
      {errorKey ? (
        <p role="alert" className="text-sm text-warning">
          {t(errorKey)}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-text-secondary">
          {message}
        </p>
      ) : null}
      <Button size="sm" variant="outline" loading={busy} onClick={refresh}>
        {t("profile.updateLocation")}
      </Button>
    </Card>
  );
}

function ProfileForm({ me }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => profileFormFrom(me));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tone: "", text: "" });
  const [update, { isLoading }] = useUpdateMeMutation();
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setMessage({ tone: "", text: "" });
    const result = validateDriverProfile(form, me);
    setErrors(result.errors);
    if (!result.ok) return;
    if (Object.keys(result.body).length === 0) {
      setMessage({ tone: "info", text: t("profile.nothingChanged") });
      return;
    }
    try {
      const saved = await update(result.body).unwrap();
      setForm(profileFormFrom(saved));
      setMessage({ tone: "success", text: t("profile.saved") });
    } catch (err) {
      setMessage({ tone: "danger", text: apiErrorMessage(err, t) });
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">{t("profile.details")}</h2>
        {message.text ? (
          <Alert tone={message.tone} role="status">
            {message.text}
          </Alert>
        ) : null}
        <TextField
          label={t("profile.name")}
          value={form.name}
          maxLength={80}
          error={errors.name && t(errors.name)}
          onChange={set("name")}
        />
        <TextField
          label={t("profile.phone")}
          type="tel"
          dir="ltr"
          hint={t("profile.phoneHint")}
          value={form.phone}
          error={errors.phone && t(errors.phone)}
          onChange={set("phone")}
        />
        <TextField
          label={t("profile.vehicle")}
          maxLength={40}
          value={form.vehicleType}
          error={errors.vehicleType && t(errors.vehicleType)}
          hint={me.vehicleType ? t("profile.cannotClear") : undefined}
          onChange={set("vehicleType")}
        />
        <Button type="submit" loading={isLoading}>
          {t("common.save")}
        </Button>
      </Card>
    </form>
  );
}

export function ProfilePage() {
  const { t } = useI18n();
  useDocumentTitle(t("nav.profile"));
  const { data: me, isLoading, isError, error, refetch } = useGetMeQuery();
  if (isLoading) return <LoadingView label={t("common.loading")} />;
  if (isError)
    return (
      <ErrorView
        message={apiErrorMessage(error, t)}
        retryLabel={t("common.retry")}
        onRetry={refetch}
      />
    );
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("nav.profile")}</h1>
        <Badge
          tone={
            me.status === "APPROVED"
              ? "success"
              : me.status === "SUSPENDED"
                ? "danger"
                : "warning"
          }
        >
          {t(`driver.status.${me.status}`)}
        </Badge>
      </div>
      <ProfileForm key={me.updatedAt ?? "form"} me={me} />
      <LocationCard me={me} />
    </div>
  );
}
