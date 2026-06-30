import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../../components/Icon";
import RegistrationButton from "../../components/RegistrationButton";
import { getEventById } from "../../services/eventService";
import {
  isAlreadyRegistered,
  registerForEvent,
} from "../../services/registrationService";
import supabase from "../../supabase/supabase";
import "../../styles/events.css";
import "../../styles/participant-events.css";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState("—");
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEventById(id);
      setEvent(data);

      if (data.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", data.created_by)
          .maybeSingle();

        setOrganizer(profile?.name || "—");
      }

      const registered = await isAlreadyRegistered(id);
      setIsRegistered(registered);
    } catch (err) {
      toast.error(err.message);
      navigate("/participant/browse");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await registerForEvent(id);
      toast.success("Registration successful!", { autoClose: 2200 });
      setIsRegistered(true);
      setEvent((prev) => ({
        ...prev,
        registered_count: (prev.registered_count || 0) + 1,
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="events-page__loading">Loading event details...</div>;
  }

  if (!event) return null;

  const registeredCount = event.registered_count || 0;
  const maxParticipants = event.max_participants;
  const remainingSeats =
    maxParticipants != null
      ? Math.max(maxParticipants - registeredCount, 0)
      : null;

  return (
    <section className="event-details-page">
      <Link to="/participant/browse" className="event-details-page__back">
        ← Back to Browse Events
      </Link>

      <div className="event-details-page__hero">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} />
        ) : (
          <div className="event-details-page__hero-placeholder">
            <Icon name="camera" size={64} />
          </div>
        )}
        <div className="event-details-page__hero-overlay">
          <span className="participant-event-card__category">
            {event.category || "General"}
          </span>
          <h1>{event.title}</h1>
        </div>
      </div>

      <div className="event-details-page__layout">
        <div className="event-details-page__main">
          <section className="event-details-page__section">
            <h2>About This Event</h2>
            <p>{event.description || "No description provided."}</p>
          </section>

          <section className="event-details-page__section">
            <h2>Event Details</h2>
            <div className="event-details-page__info-grid">
              <div className="event-details-page__info-item">
                <Icon name="profile" size={20} />
                <div>
                  <span>Organizer</span>
                  <strong>{organizer}</strong>
                </div>
              </div>
              <div className="event-details-page__info-item">
                <Icon name="calendar" size={20} />
                <div>
                  <span>Date</span>
                  <strong>{formatDate(event.event_date)}</strong>
                </div>
              </div>
              <div className="event-details-page__info-item">
                <Icon name="calendar" size={20} />
                <div>
                  <span>Time</span>
                  <strong>{event.event_time || "—"}</strong>
                </div>
              </div>
              <div className="event-details-page__info-item">
                <Icon name="location" size={20} />
                <div>
                  <span>Venue</span>
                  <strong>{event.location || "—"}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="event-details-page__sidebar">
          <div className="event-details-page__register-card">
            <h3>Registration</h3>

            <div className="event-details-page__seats">
              <div>
                <span>Maximum Participants</span>
                <strong>{maxParticipants ?? "—"}</strong>
              </div>
              <div>
                <span>Already Registered</span>
                <strong>{registeredCount}</strong>
              </div>
              <div className="event-details-page__remaining">
                <span>Remaining Seats</span>
                <strong>
                  {remainingSeats != null ? remainingSeats : "—"}
                </strong>
              </div>
            </div>

            <RegistrationButton
              event={event}
              isRegistered={isRegistered}
              registering={registering}
              onRegister={handleRegister}
              variant="details"
            />

            {isRegistered && (
              <>
                <Link
                  to={`/participant/qr-ticket?event=${event.id}`}
                  className="event-details-page__qr-link"
                >
                  <Icon name="qrScanner" size={16} />
                  <span>View QR Ticket</span>
                </Link>
                <Link
                  to="/participant/events"
                  className="event-details-page__my-events-link"
                >
                  View in My Events →
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default EventDetails;
