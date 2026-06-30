import QRCode from "react-qr-code";
import { buildQRPayload, formatEventDate } from "../services/qrService";

function QRCodeTicket({
  eventTitle,
  participantName,
  eventDate,
  venue,
  ticketId,
  registrationId,
  eventId,
  userId,
  compact = false,
}) {
  const qrValue = buildQRPayload({
    registrationId,
    eventId,
    userId,
    ticketId,
  });

  if (compact) {
    return (
      <div className="qr-ticket qr-ticket--compact">
        <div className="qr-ticket__qr">
          <QRCode value={qrValue} size={120} />
        </div>
        <p className="qr-ticket__ticket-id">{ticketId}</p>
      </div>
    );
  }

  return (
    <article className="qr-ticket">
      <div className="qr-ticket__header">
        <span className="qr-ticket__brand">EventSphere Ticket</span>
        <span className="qr-ticket__badge">Official Entry Pass</span>
      </div>

      <h2 className="qr-ticket__event">{eventTitle}</h2>

      <div className="qr-ticket__details">
        <div className="qr-ticket__row">
          <span className="qr-ticket__label">Participant</span>
          <span className="qr-ticket__value">{participantName}</span>
        </div>
        <div className="qr-ticket__row">
          <span className="qr-ticket__label">Date</span>
          <span className="qr-ticket__value">{formatEventDate(eventDate)}</span>
        </div>
        <div className="qr-ticket__row">
          <span className="qr-ticket__label">Venue</span>
          <span className="qr-ticket__value">{venue || "—"}</span>
        </div>
        <div className="qr-ticket__row">
          <span className="qr-ticket__label">Ticket</span>
          <span className="qr-ticket__value qr-ticket__value--ticket">{ticketId}</span>
        </div>
      </div>

      <div className="qr-ticket__qr-wrap">
        <QRCode value={qrValue} size={140} />
      </div>

      <p className="qr-ticket__footer">Show this QR at the venue entrance</p>
    </article>
  );
}

export default QRCodeTicket;
