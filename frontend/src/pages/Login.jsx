import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSwitcher from "../i18n/LanguageSwitcher";

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [employeeId, setEmployeeId] = useState("001");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        employeeId,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

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

            <div className="my-auto w-full max-w-[370px]">
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {t("auth.loginTitle")}
              </h1>
              <p className="mt-3 text-base font-medium text-slate-700">
                {t("auth.loginDescription")}
              </p>

              <div className="mt-7">
                <Alert message={error} />
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 text-[12px] normal-case tracking-normal text-slate-950" htmlFor="employeeId">
                    {t("labels.employeeId")}
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder={t("placeholders.employeeId")}
                    autoComplete="username"
                    className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="mb-0 text-[12px] normal-case tracking-normal text-slate-950" htmlFor="password">
                      {t("labels.password")}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[12px] font-black text-[#1257ff] underline-offset-4 hover:text-[#0c46d6] hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("placeholders.password")}
                    className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 min-h-12 w-full rounded-full bg-[#1257ff] text-sm normal-case tracking-normal shadow-none hover:bg-[#0c46d6] disabled:bg-blue-300"
                >
                  {loading ? t("common.signingIn") : t("common.submitArrow")}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm font-medium text-slate-600">
                {t("auth.noAccount")}{" "}
                <Link
                  to="/register"
                  className="font-black text-[#1257ff] underline-offset-4 hover:text-[#0c46d6] hover:underline"
                >
                  {t("common.signUp")}
                </Link>
              </p>
            </div>
          </section>

          <section className="relative hidden min-h-[720px] overflow-hidden rounded-[18px] bg-[#10202b] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_47%,rgba(18,87,255,0.48),transparent_24rem),radial-gradient(circle_at_28%_92%,rgba(43,128,255,0.46),transparent_22rem),radial-gradient(circle_at_92%_90%,rgba(165,138,255,0.55),transparent_23rem),linear-gradient(135deg,#10252b_0%,#142b3c_45%,#496ad9_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_18%_92%,rgba(18,87,255,0.95),transparent_18rem),radial-gradient(circle_at_62%_100%,rgba(242,246,255,0.38),transparent_18rem)]" />

            <div className="absolute left-[13%] top-[28%] w-[76%] rounded-[18px] bg-[#eaf7fb] p-6 shadow-[0_30px_60px_rgba(2,8,23,0.28)]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{t("auth.analytics")}</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">184</p>
                </div>
                <div className="flex h-12 w-32 items-end gap-1.5">
                  {[28, 48, 34, 56, 38, 62, 44].map((height, index) => (
                    <span
                      key={height}
                      className={`w-full rounded-full ${index % 3 === 0 ? "bg-[#1257ff]" : "bg-slate-300"}`}
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[16px] bg-white px-5 py-6">
                <div className="flex h-56 items-end justify-between gap-4">
                  {[
                    ["Jan", 72, 44],
                    ["Feb", 118, 74],
                    ["Mar", 82, 58],
                    ["Apr", 128, 92],
                    ["May", 42, 36],
                    ["Jun", 96, 70],
                  ].map(([month, first, second]) => (
                    <div key={month} className="flex h-full flex-1 flex-col justify-end">
                      <div className="flex h-44 items-end justify-center gap-2">
                        <span className="w-3 rounded-full bg-slate-950" style={{ height: first }} />
                        <span className="w-3 rounded-full bg-[#1257ff]" style={{ height: second }} />
                      </div>
                      <span className="mt-3 text-center text-sm font-semibold text-slate-700">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-[15%] top-[15%] grid h-11 w-11 place-items-center rounded-full bg-[#1257ff] text-lg font-black text-white shadow-xl">
              i
            </div>
            <div className="absolute right-[9%] top-[33%] grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-slate-950 shadow-xl">
              ...
            </div>
            <div className="absolute right-[4.5%] top-[40%] grid h-20 w-20 place-items-center rounded-full bg-[#254352] text-xl font-black text-white shadow-xl">
              =
            </div>
            <div className="absolute right-[25%] top-[24%] grid h-16 w-16 place-items-center rounded-full bg-white/80 text-2xl font-black text-slate-950 shadow-xl">
              ^
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
