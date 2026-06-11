import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "DB" },
    { path: "/assets", label: "Assets", icon: "AS" },
    { path: "/tickets", label: "Tickets", icon: "TK" },
    { path: "/inventory", label: "Inventory", icon: "IN" },
    { path: "/repairs", label: "Repairs", icon: "RP" },
  ];

  return (
    <div className="app-shell">
      <div className="top-ribbon">GSMB IT Service Management Portal</div>

      <header className="app-header">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="btn-secondary h-11 w-11 px-0 lg:hidden"
              aria-label="Toggle navigation"
            >
              <span className="text-lg leading-none">{sidebarOpen ? "x" : "="}</span>
            </button>

            <div className="brand-mark">GS</div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                GSMB IT Service Management
              </h1>
              <p className="hidden text-sm text-slate-500 sm:block">
                Infrastructure, support and inventory operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right sm:block">
              <p className="text-sm font-black text-slate-900">{user?.name || "User"}</p>
              <p className="text-xs font-semibold capitalize text-slate-500">{user?.role || "team"}</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 mt-[112px] w-72 -translate-x-full border-r border-slate-800 bg-slate-950 px-4 py-5 text-white shadow-2xl transition lg:sticky lg:top-[73px] lg:mt-0 lg:h-[calc(100vh-73px)] lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : ""
          }`}
        >
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link ${isActive(item.path) ? "nav-link-active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black">GSMB IT Services</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Operational service desk for assets, tickets, stock and repairs.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="content-wrap">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
