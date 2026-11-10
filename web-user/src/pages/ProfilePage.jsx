import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  TextField,
  apiErrorMessage,
  useI18n,
} from "@dopamine/web-shared";
import {
  useAddAddressMutation,
  useDeleteAddressMutation,
  useListAddressesQuery,
  useLogoutAllMutation,
  useUpdateAddressMutation,
  useUpdateProfileMutation,
} from "@/api/endpoints.js";
import { authActions } from "@/lib/session.js";
import { useAppDispatch, useAuth } from "@/lib/hooks.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { socketClient } from "@/lib/socket.js";
import { AddressForm } from "@/components/AddressForm.jsx";

export function ProfilePage() {
  const { t } = useI18n();
  useDocumentTitle(t("profile.title"));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const { data: addresses = [] } = useListAddressesQuery();
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [logoutAll, { isLoading: loggingOutAll }] = useLogoutAllMutation();

  const [name, setName] = useState(user?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(null);

  async function saveProfile(e) {
    e.preventDefault();
    setSaved(false);
    if (name.trim().length < 2) return setNameError(t("validation.nameShort"));
    setNameError("");
    try {
      const updated = await updateProfile({ name: name.trim() }).unwrap();
      dispatch(authActions.userUpdated({ name: updated?.name ?? name.trim() }));
      setSaved(true);
    } catch (err) {
      setNameError(apiErrorMessage(err, t));
    }
  }

  async function signOutEverywhere() {
    try {
      await logoutAll().unwrap();
    } finally {
      socketClient.disconnect();
      dispatch(authActions.loggedOut());
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        {t("profile.title")}
      </h1>

      <Card>
        <h2 className="mb-3 text-lg font-bold text-text-primary">
          {t("profile.details")}
        </h2>
        <form onSubmit={saveProfile} noValidate className="space-y-3">
          <TextField
            label={t("profile.name")}
            value={name}
            error={nameError}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label={t("profile.email")}
            value={user?.email ?? ""}
            readOnly
            dir="ltr"
          />
          <div>
            <TextField
              label={t("profile.phone")}
              value={user?.phone ?? ""}
              readOnly
              dir="ltr"
            />
            <p className="mt-1 text-xs text-text-secondary">
              {user?.phoneVerifiedAt ? (
                <Badge tone="success">{t("profile.phoneVerified")}</Badge>
              ) : (
                <>
                  <Badge tone="warning">{t("profile.phoneNotVerified")}</Badge>{" "}
                  <Link
                    to="/verify-phone"
                    className="font-semibold text-primary"
                  >
                    {t("profile.verifyNow")}
                  </Link>
                </>
              )}
            </p>
          </div>
          {saved ? <Alert tone="success">{t("profile.saved")}</Alert> : null}
          <Button type="submit" loading={saving}>
            {t("profile.save")}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            {t("profile.addresses")}
          </h2>
          {editing !== "new" ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing("new")}>
              + {t("location.addAddress")}
            </Button>
          ) : null}
        </div>
        {editing === "new" ? (
          <div className="mb-3">
            <AddressForm
              submitLabel={t("location.save")}
              onCancel={() => setEditing(null)}
              onSubmit={async (v) => {
                await addAddress({
                  ...v,
                  isDefault: addresses.length === 0,
                }).unwrap();
                setEditing(null);
              }}
            />
          </div>
        ) : null}
        {addresses.length === 0 && editing !== "new" ? (
          <p className="text-sm text-text-secondary">
            {t("profile.noAddresses")}
          </p>
        ) : null}
        <ul className="space-y-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border border-border p-3">
              {editing === a.id ? (
                <AddressForm
                  initial={a}
                  submitLabel={t("profile.save")}
                  onCancel={() => setEditing(null)}
                  onSubmit={async (v) => {
                    await updateAddress({ id: a.id, ...v }).unwrap();
                    setEditing(null);
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {a.label}{" "}
                      {a.isDefault ? (
                        <Badge tone="primary">
                          {t("profile.defaultAddress")}
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {a.line1}, {a.city}
                    </p>
                  </div>
                  <div className="flex gap-1 text-sm">
                    {!a.isDefault ? (
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-primary hover:bg-primary-tint"
                        onClick={() =>
                          updateAddress({ id: a.id, isDefault: true })
                        }
                      >
                        {t("profile.makeDefault")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-primary hover:bg-primary-tint"
                      onClick={() => setEditing(a.id)}
                    >
                      {t("profile.edit")}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-danger hover:bg-surface-alt"
                      onClick={() => deleteAddress(a.id)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-text-primary">
          {t("profile.security")}
        </h2>
        <p className="mb-3 text-sm text-text-secondary">
          {t("profile.logoutAllHint")}
        </p>
        <Button
          variant="outline"
          loading={loggingOutAll}
          onClick={signOutEverywhere}
        >
          {t("profile.logoutAll")}
        </Button>
      </Card>
    </div>
  );
}
