import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import MyAccount from "./pages/MyAccount";
import Users from "./pages/Users";

import Assets from "./pages/Assets";
import AddAsset from "./pages/AddAsset";

import Tickets from "./pages/Tickets";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";

import Inventory from "./pages/Inventory";
import AddInventory from "./pages/AddInventory";

import Repairs from "./pages/Repairs";
import CreateRepair from "./pages/CreateRepair";

import ProtectedRoute from "./components/ProtectedRoute";
import { IT_INVENTORY_ROLES } from "./utils/roles";

function Home() {
  return <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
    </Routes>
  );
}

export default App;
