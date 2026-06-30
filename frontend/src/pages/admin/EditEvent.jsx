import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EventForm from "../../components/EventForm";
import { getEventById } from "../../services/eventService";
import "../../styles/events.css";

function EditEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await getEventById(id);
        setEvent(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  if (loading) {
    return <div className="events-page__loading">Loading Events...</div>;
  }

  if (!event) {
    return (
      <section className="events-page">
        <div className="events-page__empty">
          <h2>Event not found</h2>
          <Link to="/admin/events" className="events-page__create-btn">
            Back to Events
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="events-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Edit Event</h1>
          <p className="events-page__subtitle">Update event details</p>
        </div>
        <Link to="/admin/events" className="events-page__create-btn events-page__create-btn--secondary">
          ← Back to Events
        </Link>
      </header>

      <EventForm event={event} isEdit />
    </section>
  );
}

export default EditEvent;
