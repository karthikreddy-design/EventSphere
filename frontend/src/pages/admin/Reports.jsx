import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ErrorState from "../../components/ErrorState";
import { TableSkeleton } from "../../components/Skeleton";
import { getEvents } from "../../services/eventService";
import {
  exportToExcel,
  exportToPdf,
  getAttendanceReport,
  getEventsReport,
  getParticipantsReport,
} from "../../services/reportService";
import { PAGE_ERRORS, getErrorMessage } from "../../utils/errorMessages";
import "../../styles/events.css";
import "../../styles/attendance.css";
import "../../styles/reports.css";

const REPORT_TYPES = [
  { id: "participants", label: "Participants Report" },
  { id: "attendance", label: "Attendance Report" },
  { id: "events", label: "Events Report" },
];

const REPORT_COLUMNS = {
  participants: [
    { key: "eventName", label: "Event Name" },
    { key: "participant", label: "Participant" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "ticketId", label: "Ticket ID" },
    { key: "registeredAt", label: "Registered At" },
  ],
  attendance: [
    { key: "eventName", label: "Event Name" },
    { key: "participant", label: "Participant" },
    { key: "ticketId", label: "Ticket ID" },
    { key: "attendance", label: "Attendance" },
    { key: "checkInTime", label: "Check-in Time" },
  ],
  events: [
    { key: "title", label: "Event Title" },
    { key: "category", label: "Category" },
    { key: "date", label: "Date" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status" },
    { key: "maxParticipants", label: "Max Participants" },
    { key: "registered", label: "Registered" },
  ],
};

function Reports() {
  const [events, setEvents] = useState([]);
  const [reportType, setReportType] = useState("participants");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        toast.error(getErrorMessage(err, "Unable to load events for reports."));
      }
    };

    loadEvents();
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const eventId =
        selectedEventId === "all" ? null : Number(selectedEventId);

      let data = [];

      switch (reportType) {
        case "attendance":
          data = await getAttendanceReport(eventId);
          break;
        case "events":
          data = await getEventsReport();
          break;
        default:
          data = await getParticipantsReport(eventId);
          break;
      }

      setReport(data);
    } catch (err) {
      setError(err);
      setReport([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedEventId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const columns = REPORT_COLUMNS[reportType];

  const reportTitle = useMemo(
    () => REPORT_TYPES.find((item) => item.id === reportType)?.label || "Report",
    [reportType]
  );

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportToExcel(
        report,
        `${reportType}-report.xlsx`,
        reportTitle.replace(/\s+/g, "")
      );
      toast.success("Excel report downloaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to export Excel report."));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportToPdf(
        reportTitle,
        columns,
        report,
        `${reportType}-report.pdf`
      );
      toast.success("PDF report downloaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to export PDF report."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="attendance-page reports-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Reports</h1>
          <p className="events-page__subtitle">
            Generate and export participants, attendance, and events reports
          </p>
        </div>
        <div className="reports-page__export-actions">
          <button
            type="button"
            className="events-page__create-btn events-page__create-btn--secondary"
            onClick={handleExportExcel}
            disabled={exporting || report.length === 0}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="events-page__create-btn"
            onClick={handleExportPdf}
            disabled={exporting || report.length === 0}
          >
            Export PDF
          </button>
        </div>
      </header>

      <div className="reports-page__tabs">
        {REPORT_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`reports-page__tab ${reportType === item.id ? "reports-page__tab--active" : ""}`}
            onClick={() => setReportType(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reportType !== "events" && (
        <div className="events-page__toolbar">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error ? (
        <ErrorState
          title={PAGE_ERRORS.reports.title}
          message={PAGE_ERRORS.reports.message}
          onRetry={fetchReport}
        />
      ) : loading ? (
        <TableSkeleton rows={6} />
      ) : report.length === 0 ? (
        <div className="events-page__empty">
          <h2>No Records Found</h2>
          <p>No data available for this report.</p>
        </div>
      ) : (
        <div className="reports-page__table-wrap">
          <table className="reports-page__table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.map((row, index) => (
                <tr key={`${reportType}-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key}>{row[column.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Reports;
