import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { Alert, Button } from "../components/ui";

const registerFields = [
  {
    id: "name",
    label: "Full name",
    type: "text",
    placeholder: "John Doe",
    autoComplete: "name",
    required: true,
    span: "sm:col-span-2",
  },
  {
    id: "email",
    label: "Email address",
    type: "email",
    placeholder: "your@email.com",
    autoComplete: "email",
    required: true,
  },
  {
    id: "employeeId",
    label: "Employee ID",
    type: "text",
    placeholder: "EMP-001",
    autoComplete: "off",
    required: true,
  },
  {
    id: "password",
    label: "Password",
    type: "password",
    placeholder: "Create a password",
    autoComplete: "new-password",
    required: true,
  },
  {
    id: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "0700000000",
    autoComplete: "tel",
    inputMode: "tel",
  },
  {
    id: "department",
    label: "Department",
    type: "text",
    placeholder: "IT / HR / Finance",
    autoComplete: "organization",
  },
  {
    id: "designation",
    label: "Designation",
    type: "text",
    placeholder: "Assistant Director",
    autoComplete: "organization-title",
  },
  {
    id: "officeLocation",
    label: "Office location",
    type: "text",
    placeholder: "Head Office / Branch",
    autoComplete: "street-address",
    span: "sm:col-span-2",
  },
];

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
    <div className="min-h-screen bg-[#d9dde4] px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[22px] bg-[#f8fbff] p-5 shadow-[0_24px_70px_rgba(17,24,39,0.14)] lg:min-h-[760px] lg:grid-cols-[0.98fr_1.02fr] lg:gap-8 lg:p-7">
          <section className="flex min-h-[700px] flex-col px-3 py-5 sm:px-8 lg:px-9 lg:py-8">
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

            <div className="my-auto w-full max-w-[590px]">
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Create your account
              </h1>
              <p className="mt-3 max-w-lg text-base font-medium text-slate-700">
                Register your staff profile to access IT service management.
              </p>

              <div className="mt-6">
                <Alert message={error} />
              </div>

              <form onSubmit={handleSubmit} className="mt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {registerFields.map((field) => (
                    <div key={field.id} className={field.span || ""}>
                      <label
                        className="mb-2 text-[12px] normal-case tracking-normal text-slate-950"
                        htmlFor={field.id}
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type}
                        name={field.id}
                        value={formData[field.id]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                        inputMode={field.inputMode}
                        className="h-12 rounded-full border-slate-300 px-5 font-medium shadow-none focus:border-[#1257ff] focus:ring-[#d9e6ff]"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-5 min-h-12 w-full rounded-full bg-[#1257ff] text-sm normal-case tracking-normal shadow-none hover:bg-[#0c46d6] disabled:bg-blue-300"
                >
                  {loading ? "Creating account..." : "Create account ->"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm font-medium text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-black text-[#1257ff] underline-offset-4 hover:text-[#0c46d6] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </section>

          <section className="relative hidden min-h-[720px] overflow-hidden rounded-[18px] bg-[#10202b] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_34%,rgba(18,87,255,0.5),transparent_23rem),radial-gradient(circle_at_88%_18%,rgba(125,96,255,0.35),transparent_17rem),radial-gradient(circle_at_35%_100%,rgba(80,169,255,0.55),transparent_24rem),linear-gradient(135deg,#0f252c_0%,#142c3d_48%,#4063d8_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_18%_96%,rgba(18,87,255,0.95),transparent_18rem),radial-gradient(circle_at_76%_92%,rgba(240,245,255,0.34),transparent_20rem)]" />

            <div className="absolute left-[12%] top-[16%] w-[76%] rounded-[20px] bg-[#eaf7fb] p-6 shadow-[0_30px_60px_rgba(2,8,23,0.3)]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-lg font-semibold text-slate-950">User access</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">Ready</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1257ff] text-xl font-black text-white">
                  +
                </div>
              </div>

              <div className="mt-7 grid grid-cols-[auto_1fr] gap-x-4 gap-y-5 rounded-[18px] bg-white p-5">
                {[
                  ["01", "Profile details", "Full staff identity captured"],
                  ["02", "Department info", "Office and role mapped"],
                  ["03", "Helpdesk access", "Requests enabled after sign up"],
                ].map(([step, title, detail], index) => (
                  <div key={step} className="contents">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8efff] text-sm font-black text-[#1257ff]">
                      {step}
                    </span>
                    <div className={index === 2 ? "" : "border-b border-slate-100 pb-4"}>
                      <p className="text-base font-black text-slate-950">{title}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["IT", "24"],
                  ["Assets", "81"],
                  ["Tickets", "156"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[16px] bg-white px-4 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-[12%] top-[12%] grid h-12 w-12 place-items-center rounded-full bg-[#1257ff] text-lg font-black text-white shadow-xl">
              ID
            </div>
            <div className="absolute right-[7%] top-[34%] grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-slate-950 shadow-xl">
              OK
            </div>
            <div className="absolute right-[18%] bottom-[16%] flex h-16 w-44 items-center justify-center rounded-full bg-white/90 px-5 text-sm font-black text-slate-950 shadow-xl">
              Staff portal
            </div>
            <div className="absolute left-[10%] bottom-[12%] grid h-20 w-20 place-items-center rounded-full bg-[#254352] text-2xl font-black text-white shadow-xl">
              GS
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Register;
