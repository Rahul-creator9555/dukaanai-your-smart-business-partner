import { useEffect, useRef, useState } from "react";
import { Loader2, ScanLine, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string, format?: string) => void;
};

// Minimal BarcodeDetector typing (not in lib.dom yet)
type DetectedBarcode = { rawValue: string; format: string };
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unsupported" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    const detector = new Ctor({
      formats: [
        "qr_code",
        "ean_13",
        "ean_8",
        "code_128",
        "code_39",
        "upc_a",
        "upc_e",
        "itf",
      ],
    });

    const start = async () => {
      setStatus("loading");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("ready");

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0) {
              onDetected(codes[0].rawValue, codes[0].format);
              return;
            }
          } catch {
            // ignore per-frame errors
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setErrorMsg((e as Error).message || "Camera access denied");
        setStatus("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Scan QR / Barcode</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Close scanner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Starting camera…
          </div>
        )}

        {(status === "unsupported" || status === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center text-sm">
            <p className="font-semibold">
              {status === "unsupported" ? "Scanner not supported here" : "Camera unavailable"}
            </p>
            <p className="text-white/70">
              {status === "unsupported"
                ? "This browser can't read codes with the camera. Enter the code below instead."
                : errorMsg || "Allow camera access, or enter the code below."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = manual.trim();
                if (v) onDetected(v, "manual");
              }}
              className="mt-2 flex w-full max-w-xs gap-2"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Enter barcode / code"
                aria-label="Enter product code"
                className="h-12 flex-1 rounded-2xl bg-white/10 px-4 text-sm text-white placeholder:text-white/50 outline-none focus:bg-white/15"
              />
              <button
                type="submit"
                className="h-12 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Use
              </button>
            </form>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-64 w-64 rounded-3xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                <span className="absolute left-0 right-0 top-1/2 h-0.5 animate-pulse bg-primary" />
              </div>
            </div>
            <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/80">
              Align the code inside the frame
            </p>
          </>
        )}
      </div>
    </div>
  );
}
