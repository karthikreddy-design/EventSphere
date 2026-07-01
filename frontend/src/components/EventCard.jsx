import { Link } from "react-router-dom";
import Icon from "./Icon";

function EventCard({ event, onDelete }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <article className="event-card">
      <div className="event-card__image-wrap">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="event-card__image" loading="lazy" />
        ) : (
          <div className="event-card__image-placeholder">
            <Icon name="camera" size={28} />
          </div>
        )}
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>

        <div className="event-card__meta">
          <p>
            <strong>Category</strong>
            <span>{event.category || "—"}</span>
          </p>
          <p>
            <strong>Location</strong>
            <span>{event.location || "—"}</span>
          </p>
          <p>
            <strong>Date</strong>
            <span>{formatDate(event.event_date)}</span>
          </p>
          <p>
            <strong>Time</strong>
            <span>{event.event_time || "—"}</span>
          </p>
          <p>
            <strong>Participants</strong>
            <span>
              {event.registered_count || 0} / {event.max_participants || "—"}
            </span>
          </p>
          <p>
            <strong>Status</strong>
            <span className={`event-card__status event-card__status--${(event.status || "upcoming").toLowerCase()}`}>
              {event.status || "Upcoming"}
            </span>
          </p>
        </div>

        <div className="event-card__actions">
          <Link
            to={`/admin/events/${event.id}/participants`}
            className="event-card__btn event-card__btn--participants"
          >
            <Icon name="participants" size={14} />
            <span>Participants</span>
          </Link>
          <Link to={`/admin/events/edit/${event.id}`} className="event-card__btn event-card__btn--edit">
            <Icon name="edit" size={14} />
            <span>Edit</span>
          </Link>
          <button
            type="button"
            className="event-card__btn event-card__btn--delete"
            onClick={() => onDelete(event)}
          >
            <Icon name="delete" size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
