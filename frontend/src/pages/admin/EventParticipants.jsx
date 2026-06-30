import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getEventById } from "../../services/eventService";
import { getEventParticipants } from "../../services/attendanceService";
import { formatCheckInTime } from "../../services/qrService";
import "../../styles/events.css";
import "../../styles/attendance.css";

function EventParticipants() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, participantData] = await Promise.all([
        getEventById(id),
        getEventParticipants(id),
      ]);
      setEvent(eventData);
      setParticipants(participantData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="events-page__loading">Loading participants...</div>;
  }

  const presentCount = participants.filter((p) => p.attendance).length;

  return (
    <section className="attendance-page event-participants-page">
      <Link to="/admin/events" className="event-details-page__back">
        ← Back to Events
      </Link>

      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">{event?.title}</h1>
          <p className="events-page__subtitle">
            Participants — {presentCount} present / {participants.length} registered
          </p>
        </div>
        <Link to="/admin/scan-attendance" className="events-page__create-btn">
          Scan Attendance
        </Link>
      </header>

      {participants.length === 0 ? (
        <div className="events-page__empty">
          <h2>No Participants Yet</h2>
          <p>No one has registered for this event.</p>
        </div>
      ) : (
        <div className="event-participants-page__list">
          {participants.map((participant) => (
            <article
              key={participant.registrationId}
              className="event-participants-page__row"
            >
              <div className="event-participants-page__info">
                <strong>{participant.participantName}</strong>
                <span className="event-participants-page__ticket">
                  {participant.ticketId}
                </span>
              </div>
              <div className="event-participants-page__status">
                <span
                  className={`event-participants-page__badge event-participants-page__badge--${
                    participant.attendance ? "present" : "absent"
                  }`}
                >
                  {participant.attendance ? "Present" : "Absent"}
                </span>
                <span className="event-participants-page__time">
                  {participant.attendance
                    ? formatCheckInTime(participant.checkInTime)
                    : "—"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default EventParticipants;
