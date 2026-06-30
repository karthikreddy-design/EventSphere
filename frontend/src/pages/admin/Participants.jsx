import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ErrorState from "../../components/ErrorState";
import Icon from "../../components/Icon";
import { TableSkeleton } from "../../components/Skeleton";
import { getEvents } from "../../services/eventService";
import {
  getAllParticipantRegistrations,
  getParticipantDetails,
  mapParticipantsForExport,
  PARTICIPANT_EXPORT_COLUMNS,
} from "../../services/participantService";
import { exportToExcel, exportToPdf } from "../../services/reportService";
import { formatCheckInTime } from "../../services/qrService";
import { PAGE_ERRORS, getErrorMessage } from "../../utils/errorMessages";
import "../../styles/events.css";
import "../../styles/attendance.css";
import "../../styles/participants.css";

function Participants() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [detailUserId, setDetailUserId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        toast.error(getErrorMessage(err, "Unable to load events."));
      }
    };

    loadEvents();
  }, []);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const eventId =
        selectedEventId === "all" ? null : Number(selectedEventId);
      const data = await getAllParticipantRegistrations(eventId);
      setParticipants(data);
    } catch (err) {
      setError(err);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants;

    const query = search.toLowerCase();
    return participants.filter(
      (row) =>
        row.participantName.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.eventTitle.toLowerCase().includes(query) ||
        row.ticketId.toLowerCase().includes(query)
    );
  }, [participants, search]);

  const stats = useMemo(() => {
    const presentCount = filteredParticipants.filter((row) => row.attendance).length;
    return {
      total: filteredParticipants.length,
      presentCount,
      absentCount: filteredParticipants.length - presentCount,
    };
  }, [filteredParticipants]);

  const openParticipantDetails = async (userId) => {
    setDetailUserId(userId);
    setDetail(null);
    setDetailLoading(true);

    try {
      const data = await getParticipantDetails(userId);
      setDetail(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to load participant details."));
      setDetailUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeParticipantDetails = () => {
    setDetailUserId(null);
    setDetail(null);
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportToExcel(
        mapParticipantsForExport(filteredParticipants),
        "participants-report.xlsx",
        "Participants"
      );
      toast.success("Participant data exported to Excel");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to export participant data."));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportToPdf(
        "Participants Report",
        PARTICIPANT_EXPORT_COLUMNS,
        mapParticipantsForExport(filteredParticipants),
        "participants-report.pdf"
      );
      toast.success("Participant data exported to PDF");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to export participant data."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="participants-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Participants</h1>
          <p className="events-page__subtitle">
            View and manage people who registered for events
          </p>
        </div>
        <div className="reports-page__export-actions">
          <button
            type="button"
            className="events-page__create-btn events-page__create-btn--secondary"
            onClick={handleExportExcel}
            disabled={exporting || filteredParticipants.length === 0}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="events-page__create-btn"
            onClick={handleExportPdf}
            disabled={exporting || filteredParticipants.length === 0}
          >
            Export PDF
          </button>
        </div>
      </header>

      <div className="participants-page__stats">
        <article className="participants-page__stat">
          <span className="participants-page__stat-label">Total Registrations</span>
          <strong className="participants-page__stat-value">{stats.total}</strong>
        </article>
        <article className="participants-page__stat">
          <span className="participants-page__stat-label">Present</span>
          <strong className="participants-page__stat-value participants-page__stat-value--present">
            {stats.presentCount}
          </strong>
        </article>
        <article className="participants-page__stat">
          <span className="participants-page__stat-label">Absent</span>
          <strong className="participants-page__stat-value participants-page__stat-value--absent">
            {stats.absentCount}
          </strong>
        </article>
      </div>

      <div className="events-page__toolbar participants-page__toolbar">
        <label className="events-page__search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants by name, email, or event"
          />
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          aria-label="Filter by event"
        >
          <option value="all">All Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState
          title={PAGE_ERRORS.participants.title}
          message={PAGE_ERRORS.participants.message}
          onRetry={fetchParticipants}
        />
      ) : loading ? (
        <TableSkeleton rows={6} />
      ) : filteredParticipants.length === 0 ? (
        <div className="events-page__empty">
          <span className="events-page__empty-icon" aria-hidden="true">
            <Icon name="participants" size={48} />
          </span>
          <h2>No Participants Found</h2>
          <p>
            {participants.length === 0
              ? "No one has registered for events yet."
              : "Try adjusting your search or event filter."}
          </p>
        </div>
      ) : (
        <div className="reports-page__table-wrap participants-page__table-wrap">
          <table className="reports-page__table participants-page__table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Email</th>
                <th>Event</th>
                <th>Status</th>
                <th>Attendance</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((row) => (
                <tr key={row.registrationId}>
                  <td>
                    <strong className="participants-page__name">{row.participantName}</strong>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.eventTitle}</td>
                  <td>
                    <span className="participants-page__status-badge">{row.status}</span>
                  </td>
                  <td>
                    <span
                      className={`participants-page__attendance-badge participants-page__attendance-badge--${
                        row.attendance ? "present" : "absent"
                      }`}
                    >
                      {row.attendanceLabel}
                    </span>
                  </td>
                  <td className="participants-page__actions-cell">
                    <button
                      type="button"
                      className="participants-page__view-btn"
                      onClick={() => openParticipantDetails(row.userId)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailUserId && (
        <div className="participants-modal" role="presentation" onClick={closeParticipantDetails}>
          <div
            className="participants-modal__content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="participant-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="participants-modal__header">
              <div>
                <h2 id="participant-detail-title">Participant Details</h2>
                {detail && (
                  <p>{detail.profile.name} · {detail.profile.email}</p>
                )}
              </div>
              <button
                type="button"
                className="participants-modal__close"
                onClick={closeParticipantDetails}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            {detailLoading ? (
              <div className="participants-modal__loading">Loading details...</div>
            ) : detail ? (
              <div className="participants-modal__body">
                <section className="participants-modal__section">
                  <h3>Profile</h3>
                  <dl className="participants-modal__profile-grid">
                    <div>
                      <dt>Name</dt>
                      <dd>{detail.profile.name}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{detail.profile.email}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{detail.profile.phone}</dd>
                    </div>
                    <div>
                      <dt>Department</dt>
                      <dd>{detail.profile.department}</dd>
                    </div>
                  </dl>
                </section>

                <section className="participants-modal__section">
                  <h3>Registered Events ({detail.stats.totalEvents})</h3>
                  <div className="participants-modal__table-wrap">
                    <table className="participants-modal__table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Registered On</th>
                          <th>Ticket ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.registrations.map((row) => (
                          <tr key={row.registrationId}>
                            <td>{row.eventTitle}</td>
                            <td>
                              {row.registeredAt
                                ? new Date(row.registeredAt).toLocaleString("en-GB")
                                : "—"}
                            </td>
                            <td>{row.ticketId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="participants-modal__section">
                  <h3>Attendance History</h3>
                  <div className="participants-modal__table-wrap">
                    <table className="participants-modal__table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Attendance</th>
                          <th>Check-in Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.registrations.map((row) => (
                          <tr key={`attendance-${row.registrationId}`}>
                            <td>{row.eventTitle}</td>
                            <td>
                              <span
                                className={`participants-page__attendance-badge participants-page__attendance-badge--${
                                  row.attendance ? "present" : "absent"
                                }`}
                              >
                                {row.attendanceLabel}
                              </span>
                            </td>
                            <td>
                              {row.attendance
                                ? formatCheckInTime(row.checkInTime)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default Participants;
