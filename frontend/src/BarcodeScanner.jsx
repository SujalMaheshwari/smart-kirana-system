// frontend/src/BarcodeScanner.jsx
// Requires: npm install html5-qrcode

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function BarcodeScanner({ onScanSuccess }) {
  const scannerRef = useRef(null);
  const isStarted = useRef(false);

  useEffect(() => {
    const scannerId = 'barcode-scanner-region';
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' }, // use rear camera
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        // On success, stop and bubble up
        if (!isStarted.current) return;
        isStarted.current = false;
        scanner.stop().catch(() => {});
        onScanSuccess(decodedText);
      },
      () => {} // ignore scan errors (fires constantly while searching)
    )
      .then(() => { isStarted.current = true; })
      .catch((err) => console.error('Scanner start error:', err));

    return () => {
      // Cleanup on unmount
      if (isStarted.current) {
        scanner.stop().catch(() => {});
        isStarted.current = false;
      }
    };
  }, []);

  return (
    <div className="bg-[#111b21] rounded-2xl border border-[#00a884]/30 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#00a884]/10 px-4 py-3 border-b border-[#00a884]/20 flex items-center gap-2">
        <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse"></div>
        <p className="text-[#00a884] font-bold text-sm">Camera Active — Point at barcode</p>
      </div>

      {/* Scanner viewport */}
      <div className="p-3">
        <div
          id="barcode-scanner-region"
          className="w-full rounded-xl overflow-hidden bg-black"
          style={{ minHeight: '220px' }}
        />
      </div>

      {/* Hint */}
      <div className="px-4 pb-3 text-center">
        <p className="text-[#8696a0] text-xs">Hold the barcode steady inside the box</p>
        <p className="text-[#8696a0] text-xs mt-0.5">Supports 1D barcodes, QR codes & EAN</p>
      </div>
    </div>
  );
}

export default BarcodeScanner;