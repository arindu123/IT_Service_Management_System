import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSwitcher from "../i18n/LanguageSwitcher";

function ForgotPassword() {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState("");
  const [lookup, setLookup] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [requestingMethod, setRequestingMethod] = useState("");

  const checkEmployeeId = async (nextEmployeeId = employeeId) => {
    const trimmedEmployeeId = nextEmployeeId.trim();

    setError("");
    setMessage("");

    if (!trimmedEmployeeId) {
      setError(t("auth.employeeRequired"));
      return null;
    }

    setChecking(true);

    try {
      const response = await API.post("/auth/password-reset/check", {
        employeeId: trimmedEmployeeId,
      });
      setLookup(response.data);

      if (!response.data.registered) {
        setError(response.data.message || t("auth.employeeNotRegistered"));
      }

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || t("auth.unableCheckEmployee"));
      return null;
    } finally {
      setChecking(false);
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    await checkEmployeeId();
  };

  const handleRequest = async (method) => {
    setError("");
    setMessage("");
    setRequestingMethod(method);

    try {
      if (method === "email") {
        const response = await API.post("/auth/forgot-password", { employeeId: employeeId.trim() });
        setMessage(response.data.message);
        return;
      }
      const response = await API.post("/auth/password-reset/request", {
        employeeId: employeeId.trim(),
        method,
      });
      setLookup(response.data);
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || t("auth.resetRequestFailed"));
    } finally {
      setRequestingMethod("");
    }
  };

  const activeRequest = lookup?.request;
  const isPending = activeRequest?.status === "pending";
  const isApproved = activeRequest?.status === "approved" && activeRequest?.resetLink;
  const isKnownUser = lookup?.registered;

  return (
    <div className="min-h-screen bg-[#d9dde4] px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[22px] bg-[#f8fbff] p-5 shadow-[0_24px_70px_rgba(17,24,39,0.14)] lg:min-h-[760px] lg:grid-cols-[0.78fr_1.22fr] lg:gap-8 lg:p-7">
          <section className="flex min-h-[620px] flex-col px-3 py-5 sm:px-8 lg:px-9 lg:py-8">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1257ff] text-xs font-black text-white">
                GS
              </div>
              <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#c8d8ff] bg-[#eaf1ff] px-3.5 py-1.5">
                <span className="text-sm font-black tracking-tight text-slate-950">{t("common.brand")}</span>
                <span className="h-4 w-px bg-[#b7c8f6]" aria-hidden="true" />
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1257ff]">
                  {t("common.itDepartment")}
                </span>
              </div>
              <LanguageSwitcher className="auth-language-switcher" />
            </div>

            <div className="my-auto w-full max-w-[420px]">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-950">
                {t("auth.accountRecovery")}
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {t("auth.resetPassword")}
              </h1>
              <p className="mt-3 text-base font-medium text-slate-700">
                {t("auth.resetDescription")}
              </p>

              <div className="mt-7 space-y-3">
                <Alert message={error} />
                {message && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {message}
                  </div>
                )}
              </div>

              <form onSubmit={handleCheck} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 text-[12px] normal-case tracking-normal text-slate-950" htmlFor="employeeId">
                    {t("labels.employeeId")}
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      setLookup(null);
                      setMessage("");
                      setError("");
                    }}
                    placeholder={t("placeholders.employeeId")}
                    autoComplete="username"
                    className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={checking}
                  className="min-h-12 w-full rounded-full bg-[#1257ff] text-sm normal-case tracking-normal shadow-none hover:bg-[#0c46d6] disabled:bg-blue-300"
                >
                  {checking
                    ? t("common.checking")
                    : activeRequest
                      ? t("common.refreshStatusArrow")
                      : t("common.checkResetOptionsArrow")}
                </Button>
              </form>

              {isKnownUser && (
                <div className="mt-5 rounded-[18px] border border-[#dbe6ff] bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#1257ff]">
                    {t("auth.registeredAccount")}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">{lookup.user.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {lookup.user.employeeId} | {lookup.user.emailMasked || t("common.emailNotAvailable")}
                  </p>
                </div>
              )}

              {isKnownUser && !activeRequest && (
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => handleRequest("it_admin")}
                    disabled={Boolean(requestingMethod)}
                    className="rounded-[18px] border border-[#c8d8ff] bg-[#eaf1ff] p-4 text-left transition hover:border-[#1257ff] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="block text-sm font-black text-slate-950">
                      {t("auth.itAdminResetTitle")}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-600">
                      {t("auth.itAdminResetDescription")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequest("email")}
                    disabled={!lookup.emailResetConfigured || !lookup.user?.emailMasked || Boolean(requestingMethod)}
                    className="rounded-[18px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#1257ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="block text-sm font-black text-slate-950">
                      {t("auth.emailResetTitle")}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-600">
                      {lookup.emailResetConfigured
                        ? t("auth.emailResetDescription")
                        : t("auth.emailResetNotConfigured")}
                    </span>
                  </button>
                </div>
              )}

              {isPending && (
                <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-800">{t("auth.pendingWithAdmin")}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-700">
                    {t("auth.pendingWithAdminDescription")}
                  </p>
                </div>
              )}

              {isApproved && (
                <div className="mt-5 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-800">{t("auth.resetLinkReady")}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
                    {t("auth.resetLinkReadyDescription")}
                  </p>
                  <Link
                    to={new URL(activeRequest.resetLink).pathname}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#1257ff] px-5 text-sm font-black text-white hover:bg-[#0c46d6]"
                  >
                    {t("common.openResetLink")}
                  </Link>
                </div>
              )}

              <p className="mt-5 text-center text-sm font-medium text-slate-600">
                {t("auth.rememberedPassword")}{" "}
                <Link
                  to="/login"
                  className="font-black text-[#1257ff] underline-offset-4 hover:text-[#0c46d6] hover:underline"
                >
                  {t("common.signIn")}
                </Link>
              </p>
            </div>
          </section>

          <section className="relative hidden min-h-[720px] overflow-hidden rounded-[18px] bg-[#10202b] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_34%,rgba(18,87,255,0.5),transparent_23rem),radial-gradient(circle_at_88%_18%,rgba(125,96,255,0.35),transparent_17rem),radial-gradient(circle_at_35%_100%,rgba(80,169,255,0.55),transparent_24rem),linear-gradient(135deg,#0f252c_0%,#142c3d_48%,#4063d8_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_18%_96%,rgba(18,87,255,0.95),transparent_18rem),radial-gradient(circle_at_76%_92%,rgba(240,245,255,0.34),transparent_20rem)]" />

            <div className="absolute left-[12%] top-[22%] w-[76%] rounded-[20px] bg-[#eaf7fb] p-6 shadow-[0_30px_60px_rgba(2,8,23,0.3)]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{t("auth.passwordSupport")}</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{t("auth.liveStatus")}</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1257ff] text-xl font-black text-white">
                  ID
                </div>
              </div>

              <div className="mt-7 rounded-[18px] bg-white p-5">
                {[
                  ["01", t("auth.verifyEmployeeId")],
                  ["02", t("auth.chooseResetMethod")],
                  ["03", t("auth.openApprovedResetLink")],
                ].map(([step, title]) => (
                  <div key={step} className="flex items-center gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8efff] text-sm font-black text-[#1257ff]">
                      {step}
                    </span>
                    <p className="text-base font-black text-slate-950">{title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-[8%] top-[35%] grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-slate-950 shadow-xl">
              OK
            </div>
            <div className="absolute right-[17%] bottom-[18%] flex h-16 w-44 items-center justify-center rounded-full bg-white/90 px-5 text-sm font-black text-slate-950 shadow-xl">
              {t("auth.resetRequest")}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
