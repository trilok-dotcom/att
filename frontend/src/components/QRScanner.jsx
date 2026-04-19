import { useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner({ onScanSuccess }) {
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState("");
  const scannerId = useMemo(() => `scanner-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (scannerRef.current) return undefined;

    const scanner = new Html5QrcodeScanner(
      scannerId,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        videoConstraints: {
          facingMode: "environment"
        },
        supportedScanTypes: [0] // SCAN_TYPE_CAMERA
      },
      false
    );

    let lastScannedText = null;

    scanner.render(
      (decodedText) => {
        if (decodedText !== lastScannedText) {
          lastScannedText = decodedText;
          setScanError("");
          onScanSuccess(decodedText);
        }
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scannerId, onScanSuccess]);

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-700">Scan Teacher QR</h3>
      <div id={scannerId} />
      {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}
    </div>
  );
}
