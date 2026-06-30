import { Link } from "react-router-dom";
import EventForm from "../../components/EventForm";
import "../../styles/events.css";

function CreateEvent() {
  return (
    <section className="events-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Create Event</h1>
          <p className="events-page__subtitle">Add a new event to EventSphere</p>
        </div>
        <Link to="/admin/events" className="events-page__create-btn events-page__create-btn--secondary">
          ← Back to Events
        </Link>
      </header>

      <EventForm />
    </section>
  );
}

export default CreateEvent;
