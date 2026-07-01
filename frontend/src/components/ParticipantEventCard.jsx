import { Link } from "react-router-dom";
import Icon from "./Icon";
import RegistrationButton from "./RegistrationButton";

function ParticipantEventCard({ event, isRegistered, onRegister, registering }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const registeredCount = event.registered_count || 0;
  const maxParticipants = event.max_participants;

  return (
    <article className="participant-event-card">
      <Link
        to={`/participant/events/${event.id}`}
        className="participant-event-card__link"
      >
        <div className="participant-event-card__image-wrap">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="participant-event-card__image"
              loading="lazy"
            />
          ) : (
            <div className="participant-event-card__image-placeholder">
              <Icon name="camera" size={28} />
            </div>
          )}
        </div>

        <div className="participant-event-card__body">
          <span className="participant-event-card__category">
            {event.category || "General"}
          </span>
          <h3 className="participant-event-card__title">{event.title}</h3>

          <div className="participant-event-card__meta">
            <p>
              <Icon name="calendar" size={14} />
              <span>{formatDate(event.event_date)}</span>
            </p>
            <p>
              <Icon name="location" size={14} />
              <span>{event.location || "—"}</span>
            </p>
          </div>

          <div className="participant-event-card__stats">
            <div>
              <span className="participant-event-card__stat-label">Seats</span>
              <span className="participant-event-card__stat-value">
                {maxParticipants ?? "—"}
              </span>
            </div>
            <div>
              <span className="participant-event-card__stat-label">Registered</span>
              <span className="participant-event-card__stat-value">
                {registeredCount}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="participant-event-card__footer">
        <RegistrationButton
          event={event}
          isRegistered={isRegistered}
          registering={registering}
          onRegister={onRegister}
          variant="card"
        />
      </div>
    </article>
  );
}

export default ParticipantEventCard;
