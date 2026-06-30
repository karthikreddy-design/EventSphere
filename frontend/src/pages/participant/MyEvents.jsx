import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../../components/Icon";
import {
  cancelRegistration,
  getMyEvents,
} from "../../services/registrationService";
import { getAttendanceLabel, hasEventStarted } from "../../utils/eventValidation";
import "../../styles/events.css";
import "../../styles/participant-events.css";

function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchMyEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyEvents();
      setEvents(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleCancel = async (event) => {
    if (!window.confirm(`Cancel registration for "${event.title}"?`)) return;

    setCancellingId(event.id);
    try {
      await cancelRegistration(event.id);
      toast.success("Registration cancelled. Seat is now available.");
      fetchMyEvents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getAttendanceClass = (event, attendance) => {
    const label = getAttendanceLabel(event, attendance);
    return label.toLowerCase();
  };

  return (
    <section className="participant-events-page my-events-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">My Events</h1>
          <p className="events-page__subtitle">
            Events you have registered for
          </p>
        </div>
        <Link to="/participant/browse" className="events-page__create-btn">
          Browse Events
        </Link>
      </header>

      {loading ? (
        <div className="events-page__loading">Loading your events...</div>
      ) : events.length === 0 ? (
        <div className="events-page__empty">
          <span className="events-page__empty-icon" aria-hidden="true">
            <Icon name="ticket" size={48} />
          </span>
          <h2>No Registered Events</h2>
          <p>Browse events and register to see them here.</p>
          <Link to="/participant/browse" className="events-page__create-btn">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="my-events-page__grid">
          {events.map((event) => {
            const canCancel = !hasEventStarted(event);
            const attendanceLabel = getAttendanceLabel(event, event.attendance);

            return (
              <article key={event.registrationId} className="my-events-page__event-card">
                <div className="my-events-page__banner">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} />
                  ) : (
                    <div className="my-events-page__placeholder">
                      <Icon name="camera" size={40} />
                    </div>
                  )}
                </div>

                <div className="my-events-page__card-body">
                  <h3>{event.title}</h3>

                  <div className="my-events-page__meta">
                    <p>
                      <Icon name="calendar" size={16} />
                      <span>{formatDate(event.event_date)}</span>
                    </p>
                    <p>
                      <Icon name="location" size={16} />
                      <span>{event.location || "—"}</span>
                    </p>
                  </div>

                  <div className="my-events-page__badges">
                    <span
                      className={`my-events-page__attendance my-events-page__attendance--${getAttendanceClass(event, event.attendance)}`}
                    >
                      {attendanceLabel}
                    </span>
                    <span
                      className={`event-card__status event-card__status--${(event.status || "upcoming").toLowerCase()}`}
                    >
                      {event.status || "Upcoming"}
                    </span>
                  </div>

                  <div className="my-events-page__card-actions">
                    <Link
                      to={`/participant/qr-ticket?event=${event.id}`}
                      className="my-events-page__btn my-events-page__btn--qr"
                    >
                      <Icon name="qrScanner" size={16} />
                      <span>QR Ticket</span>
                    </Link>

                    <Link
                      to={`/participant/events/${event.id}`}
                      className="my-events-page__btn my-events-page__btn--view"
                    >
                      View Details
                    </Link>

                    {canCancel ? (
                      <button
                        type="button"
                        className="my-events-page__btn my-events-page__btn--cancel"
                        onClick={() => handleCancel(event)}
                        disabled={cancellingId === event.id}
                      >
                        {cancellingId === event.id
                          ? "Cancelling..."
                          : "Cancel Registration"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="my-events-page__btn my-events-page__btn--cancel-disabled"
                        disabled
                        title="Cancellation is disabled after the event starts"
                      >
                        Cancellation Closed
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MyEvents;
