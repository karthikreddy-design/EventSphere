import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import EventCard from "../../components/EventCard";
import ErrorState from "../../components/ErrorState";
import Icon from "../../components/Icon";
import { ListSkeleton } from "../../components/Skeleton";
import { deleteEvent, getEvents } from "../../services/eventService";
import { PAGE_ERRORS, getErrorMessage } from "../../utils/errorMessages";
import "../../styles/events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError(err);
      toast.error(getErrorMessage(err, "Unable to load events."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      );
    }

    if (filter !== "All") {
      result = result.filter(
        (event) => (event.status || "Upcoming") === filter
      );
    }

    switch (sort) {
      case "Oldest":
        result.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "A-Z":
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        result.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }

    return result;
  }, [events, search, filter, sort]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      toast.success("Event deleted successfully");
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="events-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Events</h1>
          <p className="events-page__subtitle">Manage all events in EventSphere</p>
        </div>
      </header>

      <div className="events-page__toolbar">
        <label className="events-page__search">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Search Event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="A-Z">A-Z</option>
        </select>
      </div>

      {error ? (
        <ErrorState
          title={PAGE_ERRORS.events.title}
          message={PAGE_ERRORS.events.message}
          onRetry={fetchEvents}
        />
      ) : loading ? (
        <ListSkeleton rows={3} />
      ) : filteredEvents.length === 0 ? (
        <div className="events-page__empty">
          <span className="events-page__empty-icon" aria-hidden="true">
            <Icon name="empty" size={48} />
          </span>
          <h2>No Events Found</h2>
          <p>Create your first event.</p>
          <Link to="/admin/events/create" className="events-page__create-btn">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="events-page__grid">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="events-modal">
          <div className="events-modal__content">
            <h3>Are you sure?</h3>
            <p>
              Delete <strong>{deleteTarget.title}</strong>? This action cannot be
              undone.
            </p>
            <div className="events-modal__actions">
              <button
                type="button"
                className="event-form__btn event-form__btn--primary"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "YES"}
              </button>
              <button
                type="button"
                className="event-form__btn event-form__btn--secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Events;
