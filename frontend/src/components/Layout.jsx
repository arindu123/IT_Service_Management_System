import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white hidden md:block">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-xl font-bold">IT Service</h1>
          <p className="text-sm text-blue-200">Management System</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Dashboard
          </Link>

          <Link
            to="/assets"
            className="block px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Assets
          </Link>

          <Link
            to="/tickets"
            className="block px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tickets
          </Link>

          <Link
            to="/inventory"
            className="block px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Inventory
          </Link>

          <Link
            to="/repairs"
            className="block px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Repairs
          </Link>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Government Office IT Department
            </h2>
            <p className="text-sm text-gray-500">
              Smart IT Service Management System
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-700">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default Layout;