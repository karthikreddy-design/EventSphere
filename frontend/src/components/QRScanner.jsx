import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef("");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-scanner-region",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (decodedText === lastScanRef.current) return;
        lastScanRef.current = decodedText;
        onScanRef.current(decodedText);
      },
      () => {}
    );

    setInitializing(false);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="qr-scanner">
      {initializing && <p className="qr-scanner__loading">Starting camera...</p>}
      <div id="qr-scanner-region" className="qr-scanner__region" />
    </div>
  );
}

export default QRScanner;
