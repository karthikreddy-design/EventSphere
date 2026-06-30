import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import QRCodeTicket from "../../components/QRCodeTicket";
import Icon from "../../components/Icon";
import { getMyTickets } from "../../services/registrationService";
import "../../styles/events.css";
import "../../styles/attendance.css";

function MyTicket() {
  const [searchParams] = useSearchParams();
  const eventFilter = searchParams.get("event");
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyTickets();
      setTickets(data);

      if (eventFilter) {
        const match = data.find(
          (ticket) => String(ticket.eventId) === String(eventFilter)
        );
        setSelectedId(match?.registrationId ?? data[0]?.registrationId ?? null);
      } else {
        setSelectedId(data[0]?.registrationId ?? null);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const selectedTicket = tickets.find(
    (ticket) => ticket.registrationId === selectedId
  );

  if (loading) {
    return <div className="events-page__loading">Loading your tickets...</div>;
  }

  if (tickets.length === 0) {
    return (
      <section className="attendance-page">
        <div className="events-page__empty">
          <span className="events-page__empty-icon" aria-hidden="true">
            <Icon name="qrScanner" size={48} />
          </span>
          <h2>No QR Tickets Yet</h2>
          <p>Register for an event to get your QR ticket.</p>
          <Link to="/participant/browse" className="events-page__create-btn">
            Browse Events
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="attendance-page my-ticket-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">My QR Ticket</h1>
          <p className="events-page__subtitle">
            Show this QR code at the venue for check-in
          </p>
        </div>
      </header>

      {tickets.length > 1 && (
        <div className="my-ticket-page__selector">
          <label htmlFor="ticket-select">Select Event</label>
          <select
            id="ticket-select"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {tickets.map((ticket) => (
              <option key={ticket.registrationId} value={ticket.registrationId}>
                {ticket.eventTitle} — {ticket.ticketId}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedTicket && (
        <div className="my-ticket-page__ticket-wrap">
          <QRCodeTicket
            eventTitle={selectedTicket.eventTitle}
            participantName={selectedTicket.participantName}
            eventDate={selectedTicket.eventDate}
            venue={selectedTicket.venue}
            ticketId={selectedTicket.ticketId}
            registrationId={selectedTicket.registrationId}
            eventId={selectedTicket.eventId}
            userId={selectedTicket.userId}
          />

          {selectedTicket.attendance && (
            <p className="my-ticket-page__checked-in">
              Checked in at{" "}
              {selectedTicket.checkInTime
                ? new Date(selectedTicket.checkInTime).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "—"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default MyTicket;
