import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner({ onScanSuccess }) {
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState("");
  const scannerId = useMemo(() => `scanner-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!scannerId) return;

    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;
    let lastScannedText = null;

    html5QrCode.start(
      { facingMode: "environment" }, 
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
      },
      (decodedText) => {
        if (decodedText !== lastScannedText) {
          lastScannedText = decodedText;
          setScanError("");
          onScanSuccess(decodedText);
        }
      },
      (errorMessage) => {
        // Ignored. html5-qrcode rapidly fires error callbacks when no QR code is in frame
      }
    ).catch(err => {
      setScanError("Failed to start camera. Please ensure camera permissions are granted.");
      console.error("Camera start error:", err);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch(() => {});
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
