import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#bae6fd_0,#f8fafc_36%,#e2e8f0_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/70 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="brand-mark mb-8 bg-white text-slate-950">GS</div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                GSMB service operations
              </p>
              <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight">
                A focused workspace for IT assets, requests and repairs.
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Assets", "Tickets", "Inventory"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-black">{item}</p>
                  <p className="mt-1 text-xs text-slate-400">Managed</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mb-8 lg:hidden">
              <div className="brand-mark mb-5">GS</div>
              <h1 className="text-2xl font-black text-slate-950">GSMB IT Service Management</h1>
              <p className="mt-2 text-sm text-slate-500">Sign in to continue.</p>
            </div>

            <div className="mx-auto max-w-md">
              <p className="page-eyebrow">Secure access</p>
              <h2 className="page-title">Sign in</h2>
              <p className="page-description">
                Use your service desk credentials to open the operations dashboard.
              </p>

              <div className="mt-6">
                <Alert message={error} />
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-black text-slate-800">Demo credentials</p>
                <p className="mt-2 font-mono">admin@gmail.com</p>
                <p className="font-mono">123456</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
