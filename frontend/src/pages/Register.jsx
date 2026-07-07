import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    password: "",
    role: "department_user",
    department: "",
    designation: "",
    phone: "",
    officeLocation: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/register", formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden bg-[#344a86] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="brand-mark mb-8 bg-white text-[#344a86] font-black">GS</div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f39c12]">
                GSMB Hardware Workflow
              </p>
              <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight">
                Secure requests, approvals, procurement and installation tracking.
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Requests", "Approvals", "Inventory"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-black">{item}</p>
                  <p className="mt-1 text-xs text-slate-300">Managed</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mb-8 lg:hidden">
              <div className="brand-mark mb-5">GS</div>
              <h1 className="text-2xl font-black text-slate-950">GSMB IT Helpdesk</h1>
              <p className="mt-2 text-sm text-slate-500">Create an account to get started.</p>
            </div>

            <div className="mx-auto max-w-md">
              <p className="page-eyebrow">Create account</p>
              <h2 className="page-title">Sign up</h2>
              <p className="page-description">
                Create an official user profile for helpdesk and hardware procurement requests.
              </p>

              <div className="mt-6">
                <Alert message={error} />
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="employeeId">Employee ID</label>
                  <input
                    id="employeeId"
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="EMP-001"
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., IT, HR, Finance"
                  />
                </div>

                <div className="field">
                  <label htmlFor="designation">Designation</label>
                  <input
                    id="designation"
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g., Assistant Director"
                  />
                </div>

                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0700000000"
                  />
                </div>

                <div className="field">
                  <label htmlFor="officeLocation">Office Location</label>
                  <input
                    id="officeLocation"
                    type="text"
                    name="officeLocation"
                    value={formData.officeLocation}
                    onChange={handleChange}
                    placeholder="Head Office / Branch"
                  />
                </div>


                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                <p>
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-blue-700 hover:text-blue-800">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Register;
