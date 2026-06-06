import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

function Tickets() {
    const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTickets(response.data.tickets);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load tickets");
      }
    };

    fetchTickets();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tickets</h2>
          <p className="text-gray-500">Manage IT support requests</p>
        </div>

        <button
  onClick={() => navigate("/tickets/create")}
  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
>
  Create Ticket
</button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-4">Ticket ID</th>
              <th className="p-4">Asset</th>
              <th className="p-4">Issue</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Technician</th>
            </tr>
          </thead>

          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No tickets found
                </td>
              </tr>
            )}

            {tickets.map((ticket) => (
              <tr key={ticket._id} className="border-t">
                <td className="p-4 font-semibold">{ticket.ticketId}</td>
                <td className="p-4">
                  {ticket.asset?.assetId} - {ticket.asset?.brand}
                </td>
                <td className="p-4">{ticket.issueDescription}</td>
                <td className="p-4">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                    {ticket.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4">
                  {ticket.assignedTechnician?.name || "Not assigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Tickets;