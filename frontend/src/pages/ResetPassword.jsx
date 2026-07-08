import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      setChecking(true);
      setError("");

      try {
        const response = await API.get(`/auth/password-reset/token/${encodeURIComponent(token)}`);
        setTokenInfo(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Reset link is invalid or expired");
      } finally {
        setChecking(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);

    try {
      const response = await API.post("/auth/password-reset/complete", {
        token,
        password,
      });
      setSuccess(response.data.message);
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setSaving(false);
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
                <span className="text-sm font-black tracking-tight text-slate-950">GSMB</span>
                <span className="h-4 w-px bg-[#b7c8f6]" aria-hidden="true" />
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1257ff]">
                  IT Department
                </span>
              </div>
            </div>

            <div className="my-auto w-full max-w-[390px]">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-950">
                Secure reset
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Create new password
              </h1>
              <p className="mt-3 text-base font-medium text-slate-700">
                Use the approved reset link to update your account password.
              </p>

              <div className="mt-7 space-y-3">
                <Alert message={error} />
                {success && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {success}
                  </div>
                )}
              </div>

              {checking && (
                <div className="mt-5 rounded-[18px] border border-[#dbe6ff] bg-white p-4 text-sm font-bold text-slate-600">
                  Checking reset link...
                </div>
              )}

              {!checking && tokenInfo?.valid && (
                <>
                  <div className="mt-5 rounded-[18px] border border-[#dbe6ff] bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#1257ff]">
                      Account
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">{tokenInfo.user.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {tokenInfo.user.employeeId} | {tokenInfo.user.emailMasked || "Email not available"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 text-[12px] normal-case tracking-normal text-slate-950" htmlFor="password">
                        New password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 text-[12px] normal-case tracking-normal text-slate-950" htmlFor="confirmPassword">
                        Confirm password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="min-h-12 w-full rounded-full bg-[#1257ff] text-sm normal-case tracking-normal shadow-none hover:bg-[#0c46d6] disabled:bg-blue-300"
                    >
                      {saving ? "Saving..." : "Reset password ->"}
                    </Button>
                  </form>
                </>
              )}

              {!checking && !tokenInfo?.valid && (
                <Link
                  to="/forgot-password"
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1257ff] px-5 text-sm font-black text-white hover:bg-[#0c46d6]"
                >
                  Request a new reset link
                </Link>
              )}

              <p className="mt-5 text-center text-sm font-medium text-slate-600">
                Back to{" "}
                <Link
                  to="/login"
                  className="font-black text-[#1257ff] underline-offset-4 hover:text-[#0c46d6] hover:underline"
                >
                  sign in
                </Link>
              </p>
            </div>
          </section>

          <section className="relative hidden min-h-[720px] overflow-hidden rounded-[18px] bg-[#10202b] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_47%,rgba(18,87,255,0.48),transparent_24rem),radial-gradient(circle_at_28%_92%,rgba(43,128,255,0.46),transparent_22rem),radial-gradient(circle_at_92%_90%,rgba(165,138,255,0.55),transparent_23rem),linear-gradient(135deg,#10252b_0%,#142b3c_45%,#496ad9_100%)]" />
            <div className="absolute left-[13%] top-[28%] w-[76%] rounded-[18px] bg-[#eaf7fb] p-6 shadow-[0_30px_60px_rgba(2,8,23,0.28)]">
              <p className="text-lg font-semibold text-slate-950">Password reset</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">Approved</p>
              <div className="mt-7 rounded-[18px] bg-white p-5">
                {["Validated reset link", "Create a new password", "Sign in with Employee ID"].map((item, index) => (
                  <div key={item} className="flex items-center gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8efff] text-sm font-black text-[#1257ff]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-base font-black text-slate-950">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
