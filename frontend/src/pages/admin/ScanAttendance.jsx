import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import QRScanner from "../../components/QRScanner";
import { markAttendance } from "../../services/attendanceService";
import { formatCheckInTime } from "../../services/qrService";
import "../../styles/attendance.css";

function ScanResult({ result, onScanAnother }) {
  if (!result) return null;

  const isSuccess = result.status === "SUCCESS";
  const isAlreadyMarked = result.status === "ALREADY_MARKED";

  return (
    <div
      className={`scan-result ${
        isSuccess
          ? "scan-result--success"
          : isAlreadyMarked
            ? "scan-result--warning"
            : "scan-result--error"
      }`}
    >
      <div className="scan-result__icon" aria-hidden="true">
        {isSuccess ? "✅" : isAlreadyMarked ? "⚠️" : "❌"}
      </div>

      <h2 className="scan-result__title">
        {isSuccess
          ? "Attendance Recorded"
          : isAlreadyMarked
            ? "Attendance Already Recorded"
            : "Scan Failed"}
      </h2>

      {(isSuccess || isAlreadyMarked) && (
        <div className="scan-result__details">
          <div className="scan-result__row">
            <span>Participant</span>
            <strong>{result.participantName}</strong>
          </div>
          <div className="scan-result__row">
            <span>Event</span>
            <strong>{result.eventTitle}</strong>
          </div>
          <div className="scan-result__row">
            <span>Time</span>
            <strong>{formatCheckInTime(result.checkInTime)}</strong>
          </div>
          <div className="scan-result__row">
            <span>Ticket</span>
            <strong>{result.ticketId}</strong>
          </div>
        </div>
      )}

      <button type="button" className="scan-result__btn" onClick={onScanAnother}>
        Scan Another
      </button>
    </div>
  );
}

function ScanAttendance() {
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = useCallback(async (scannedText) => {
    if (processing) return;

    setProcessing(true);
    try {
      const scanResult = await markAttendance(scannedText);
      setResult(scanResult);

      if (scanResult.status === "SUCCESS") {
        toast.success("Attendance recorded successfully", { autoClose: 2200 });
      } else if (scanResult.status === "ALREADY_MARKED") {
        toast.info("Attendance already recorded");
      }
    } catch (err) {
      toast.error(err.message);
      setResult({ status: "ERROR", message: err.message });
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  const handleScanAnother = () => {
    setResult(null);
    setScannerKey((prev) => prev + 1);
  };

  return (
    <section className="attendance-page scan-attendance-page">
      <header className="events-page__header">
        <div>
          <h1 className="events-page__title">Scan Attendance</h1>
          <p className="events-page__subtitle">
            Scan participant QR tickets to mark attendance instantly
          </p>
        </div>
      </header>

      {result ? (
        <ScanResult result={result} onScanAnother={handleScanAnother} />
      ) : (
        <div className="scan-attendance-page__scanner-wrap">
          {processing && (
            <p className="scan-attendance-page__processing">Processing scan...</p>
          )}
          <QRScanner key={scannerKey} onScan={handleScan} />
          <p className="scan-attendance-page__hint">
            Point the camera at the participant&apos;s QR ticket
          </p>
        </div>
      )}
    </section>
  );
}

export default ScanAttendance;
