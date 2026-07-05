import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { getTicketUpdates, getUnreadTicketUpdates } from "../utils/ticketUpdates";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setNotificationCount(0);
        setLatestUpdate(null);
        return;
      }

      try {
        const response = await API.get("/tickets/mine", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const tickets = response.data.tickets || [];
        const unreadUpdates = getUnreadTicketUpdates(tickets);

        setNotificationCount(unreadUpdates.length);
        setLatestUpdate(getTicketUpdates(tickets)[0] || null);
      } catch {
        setNotificationCount(0);
        setLatestUpdate(null);
      }
    };

    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, 30000);
    window.addEventListener("ticket-notifications-updated", fetchNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("ticket-notifications-updated", fetchNotifications);
    };
  }, [user?.id]);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "DB" },
    { path: "/account", label: "My Account", icon: "ME", badge: notificationCount },
    { path: "/about", label: "About", icon: "AB" },
    { path: "/assets", label: "Assets", icon: "AS" },
    { path: "/tickets", label: "Hardware Requests", icon: "HR" },
    { path: "/inventory", label: "Inventory", icon: "IN" },
    { path: "/repairs", label: "Repairs", icon: "RP" },
  ];

  return (
    <div className="app-shell">
      <div className="top-ribbon">Government IT Helpdesk & Hardware Procurement Portal</div>

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
                GSMB IT Helpdesk
              </h1>
              <p className="hidden text-sm text-slate-500 sm:block">
                Hardware service requests, procurement and inventory operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/account"
              title={latestUpdate ? `${latestUpdate.ticketId}: ${latestUpdate.comment || "Request updated"}` : "My Account"}
              className={`btn-secondary relative hidden sm:inline-flex ${isActive("/account") ? "border-cyan-300 bg-cyan-50 text-cyan-800" : ""}`}
            >
              My Account
              {notificationCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
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
                {item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black">GSMB IT Services</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Role-based workflow for requests, approvals, stock, procurement and repairs.
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
