import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ParticipantEventCard from "../../components/ParticipantEventCard";
import ErrorState from "../../components/ErrorState";
import Icon from "../../components/Icon";
import { ListSkeleton } from "../../components/Skeleton";
import { getEvents } from "../../services/eventService";
import {
  isAlreadyRegistered,
  registerForEvent,
} from "../../services/registrationService";
import {
  BROWSE_SORT_OPTIONS,
  EVENT_CATEGORIES,
  sortBrowseEvents,
} from "../../utils/eventValidation";
import { PAGE_ERRORS, getErrorMessage } from "../../utils/errorMessages";
import "../../styles/events.css";
import "../../styles/participant-events.css";

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [registeredMap, setRegisteredMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [registeringId, setRegisteringId] = useState(null);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      const openEvents = data.filter(
        (event) =>
          (event.status || "Upcoming") !== "Completed" &&
          (event.status || "Upcoming") !== "Cancelled"
      );

      const registrationChecks = await Promise.all(
        openEvents.map(async (event) => {
          const registered = await isAlreadyRegistered(event.id);
          return [event.id, registered];
        })
      );

      setRegisteredMap(Object.fromEntries(registrationChecks));
      setEvents(openEvents);
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

    if (category !== "All") {
      result = result.filter(
        (event) =>
          (event.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    return sortBrowseEvents(result, sort);
  }, [events, search, category, sort]);

  const handleRegister = async (event) => {
    setRegisteringId(event.id);
    try {
      await registerForEvent(event.id);
      toast.success("Registration successful!", { autoClose: 2200 });
      setRegisteredMap((prev) => ({ ...prev, [event.id]: true }));
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? { ...item, registered_count: (item.registered_count || 0) + 1 }
            : item
        )
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <section className="events-page participant-events-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Browse Events</h1>
          <p className="events-page__subtitle">
            Discover workshops and register for upcoming events
          </p>
        </div>
      </header>

      <div className="events-page__toolbar">
        <label className="events-page__search">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Search e.g. AI Workshop"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {EVENT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {BROWSE_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
          <p>Try a different search or category filter.</p>
        </div>
      ) : (
        <div className="events-page__grid participant-events-page__grid">
          {filteredEvents.map((event) => (
            <ParticipantEventCard
              key={event.id}
              event={event}
              isRegistered={registeredMap[event.id]}
              onRegister={handleRegister}
              registering={registeringId === event.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BrowseEvents;
