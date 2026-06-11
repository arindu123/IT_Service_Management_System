import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";

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
      <PageHeader
        eyebrow="Service desk"
        title="Support Tickets"
        description="Monitor reported issues, priorities, assignments and resolution progress."
        action={<Button onClick={() => navigate("/tickets/create")}>Create Ticket</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={`${tickets.length} records`}
        emptyLabel="Tickets"
        emptyMessage="No tickets found"
        columns={["Ticket ID", "Asset", "Issue Description", "Priority", "Status", "Assigned To"]}
      >
        {tickets.length === 0 ? (
          <EmptyRow colSpan="6" message="No tickets found" />
        ) : (
          tickets.map((ticket) => (
            <tr key={ticket._id}>
              <td className="font-black text-slate-950">{ticket.ticketId}</td>
              <td>
                <div className="font-bold text-slate-800">{ticket.asset?.assetId || "N/A"}</div>
                <div className="text-xs text-slate-500">
                  {ticket.asset?.brand} {ticket.asset?.model}
                </div>
              </td>
              <td className="max-w-md">
                <div className="truncate">{ticket.issueDescription}</div>
              </td>
              <td>
                <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
              </td>
              <td>
                <Badge tone={statusTone(ticket.status)}>{formatLabel(ticket.status)}</Badge>
              </td>
              <td>
                {ticket.assignedTechnician?.name ? (
                  <PersonName name={ticket.assignedTechnician.name} />
                ) : (
                  <span className="text-slate-400">Not assigned</span>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </Layout>
  );
}

function PersonName({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
        {initials}
      </span>
      <span className="font-semibold text-slate-700">{name}</span>
    </div>
  );
}

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityTone(priority) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";
  return "green";
}

function statusTone(status) {
  if (status === "open") return "blue";
  if (status === "assigned") return "violet";
  if (status === "in_progress") return "amber";
  if (status === "resolved") return "green";
  return "slate";
}

export default Tickets;
