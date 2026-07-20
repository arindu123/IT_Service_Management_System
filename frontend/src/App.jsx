import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import MyAccount from "./pages/MyAccount";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import Assets from "./pages/Assets";
import AddAsset from "./pages/AddAsset";
import AssetIssues from "./pages/AssetIssues";

import Tickets from "./pages/Tickets";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";

import Inventory from "./pages/Inventory";
import AddInventory from "./pages/AddInventory";

import NetworkMonitoring from "./pages/NetworkMonitoring";

import Repairs from "./pages/Repairs";
import CreateRepair from "./pages/CreateRepair";

import ProtectedRoute from "./components/ProtectedRoute";
import { IT_INVENTORY_ROLES, NETWORK_MONITORING_VIEW_ROLES } from "./utils/roles";

function Home() {
  return <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <MyAccount />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assets/add"
        element={
          <ProtectedRoute>
            <AddAsset />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets/:id/edit"
        element={
          <ProtectedRoute>
            <AddAsset />
          </ProtectedRoute>
        }
      />
      <Route
        path="/asset-issues"
        element={<ProtectedRoute roles={["admin", "system_admin", "head_of_it"]}><AssetIssues /></ProtectedRoute>}
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/create"
        element={
          <ProtectedRoute>
            <CreateTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={IT_INVENTORY_ROLES}>
            <Inventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/add"
        element={
          <ProtectedRoute roles={IT_INVENTORY_ROLES}>
            <AddInventory />
          </ProtectedRoute>
        }
      />
      <Route path="/reports" element={<ProtectedRoute roles={["admin", "system_admin", "head_of_it"]}><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={["admin", "system_admin", "head_of_it"]}><Settings /></ProtectedRoute>} />

      <Route
        path="/network"
        element={
          <ProtectedRoute roles={NETWORK_MONITORING_VIEW_ROLES}>
            <NetworkMonitoring />
          </ProtectedRoute>
        }
      />

      <Route
        path="/repairs"
        element={
          <ProtectedRoute>
            <Repairs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/repairs/create"
        element={
          <ProtectedRoute>
            <CreateRepair />
          </ProtectedRoute>
        }
      />

      <Route
        path="/repairs/:id/edit"
        element={
          <ProtectedRoute>
            <CreateRepair />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
