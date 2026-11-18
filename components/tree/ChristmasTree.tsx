"use client";

import { useEffect, useRef, useState } from "react";
import { recordClaim, startClaimSync } from "@/lib/claim-client";
import { GIFT_BY_ID, GIFTS } from "@/lib/gifts";
import { prepareOffline } from "@/lib/offline";

const BG_VIDEO = "/assets/Video/ipad-boc tham-01_2.mp4";
const ALL_VIDEOS = [BG_VIDEO, ...GIFTS.map((g) => g.video)];
const RETRY_MS = 5000;

type PrepState = {
  status: "checking" | "loading" | "retrying" | "ready" | "unsupported";
  done: number;
  total: number;
  fraction: number;
};

const ORNAMENTS = [
  { id: 1, x: 50, y: 13 },
  { id: 2, x: 50, y: 29 },
  { id: 3, x: 62, y: 43 },
  { id: 4, x: 37, y: 51 },
  { id: 7, x: 70, y: 62 },
  { id: 5, x: 27, y: 68 },
  { id: 6, x: 47, y: 70 },
];

const LOADING_LETTERS = ["  Đ", "a", "n", "g  ", "m", "ở  ", "q", "u", "à", ".", ".", "."];

const AUTO_CLOSE_MS = 15000;
const LOAD_TIMEOUT_MS = 20000;

export function ChristmasTree() {
  const appRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLVideoElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const hotspotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const openRef = useRef<(id: number) => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  const [prep, setPrep] = useState<PrepState>({ status: "checking", done: 0, total: ALL_VIDEOS.length, fraction: 0 });
  const [skipped, setSkipped] = useState(false);
  const treeVisible = prep.status === "ready" || prep.status === "unsupported" || skipped;

  useEffect(() => {
    const app = appRef.current;
    const bg = bgRef.current;
    const overlay = overlayRef.current;
    const popup = popupRef.current;
    const loading = loadingRef.current;
    if (!app || !bg || !overlay || !popup || !loading) return;

    let isOpen = false;
    let isShown = false;
    let currentGiftId = 0;
    let retried = false;
    let autoCloseTimeout: ReturnType<typeof setTimeout> | undefined;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearTimers = () => {
      clearTimeout(autoCloseTimeout);
      clearTimeout(loadTimeout);
      autoCloseTimeout = undefined;
      loadTimeout = undefined;
    };

    const closePopup = () => {
      isOpen = false;
      isShown = false;
      clearTimers();
      loading.style.display = "none";
      overlay.style.display = "none";
      overlay.classList.remove("is-loading");
      popup.pause();
      popup.removeAttribute("src");
      popup.load();
      bg.play().catch(() => {});
    };

    const openPopup = (id: number) => {
      const gift = GIFT_BY_ID.get(id);
      if (isOpen || !gift) return;
      isOpen = true;
      isShown = false;
      currentGiftId = id;
      retried = false;
      clearTimers();

      bg.pause();
      loading.style.display = "flex";
      overlay.classList.add("is-loading");
      overlay.style.display = "flex";

      popup.src = gift.video;
      popup.play().catch(() => {});
      loadTimeout = setTimeout(closePopup, LOAD_TIMEOUT_MS);
    };

    const showPopup = () => {
      if (!isOpen || isShown) return;
      isShown = true;
      clearTimeout(loadTimeout);
      loading.style.display = "none";
      overlay.classList.remove("is-loading");
      recordClaim(currentGiftId);
      autoCloseTimeout = setTimeout(closePopup, AUTO_CLOSE_MS);
    };

    const onPopupError = () => {
      if (!isOpen || isShown) return;
      const gift = GIFT_BY_ID.get(currentGiftId);
      if (!retried && gift) {
        retried = true;
        popup.src = `${gift.video}?retry=${Date.now()}`;
        popup.play().catch(() => {});
        return;
      }
      closePopup();
    };

    const updateHotspotPositions = () => {
      if (!bg.videoWidth) return;
      const videoRatio = bg.videoWidth / bg.videoHeight;
      const containerRatio = app.offsetWidth / app.offsetHeight;
      let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;

      if (videoRatio > containerRatio) {
        displayWidth = app.offsetWidth;
        displayHeight = displayWidth / videoRatio;
        offsetX = 0;
        offsetY = (app.offsetHeight - displayHeight) / 2;
      } else {
        displayHeight = app.offsetHeight;
        displayWidth = displayHeight * videoRatio;
        offsetX = (app.offsetWidth - displayWidth) / 2;
        offsetY = 0;
      }

      ORNAMENTS.forEach((pos, index) => {
        const dot = hotspotRefs.current[index];
        if (!dot) return;
        dot.style.left = (pos.x / 100) * displayWidth + offsetX + "px";
        dot.style.top = (pos.y / 100) * displayHeight + offsetY + "px";
      });
    };

    openRef.current = openPopup;
    closeRef.current = closePopup;

    bg.muted = true;

    popup.addEventListener("playing", showPopup);
    popup.addEventListener("error", onPopupError);
    bg.addEventListener("loadedmetadata", updateHotspotPositions);
    window.addEventListener("resize", updateHotspotPositions);
    updateHotspotPositions();

    const stopSync = startClaimSync();

    return () => {
      clearTimers();
      stopSync();
      popup.removeEventListener("playing", showPopup);
      popup.removeEventListener("error", onPopupError);
      bg.removeEventListener("loadedmetadata", updateHotspotPositions);
      window.removeEventListener("resize", updateHotspotPositions);
      openRef.current = () => {};
      closeRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      try {
        const result = await prepareOffline(
          ALL_VIDEOS,
          (p) => {
            if (!cancelled) setPrep({ status: "loading", ...p });
          },
          () => cancelled,
        );
        if (!cancelled) setPrep((s) => ({ ...s, status: result === "ready" ? "ready" : "unsupported" }));
      } catch {
        if (cancelled) return;
        setPrep((s) => ({ ...s, status: "retrying" }));
        retryTimer = setTimeout(run, RETRY_MS);
      }
    };
    void run();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (treeVisible) bgRef.current?.play().catch(() => {});
  }, [treeVisible]);

  const percent = Math.round(((prep.done + prep.fraction) / prep.total) * 100);

  return (
    <>
      {!treeVisible && (
        <div className="preload-screen">
          <div className="preload-title">Đang chuẩn bị quà...</div>
          <div className="preload-bar">
            <div className="preload-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="preload-detail">
            {prep.status === "retrying"
              ? `Mạng đang chập chờn, tự thử lại sau ${RETRY_MS / 1000} giây... (${prep.done}/${prep.total} video)`
              : prep.status === "checking"
                ? "Đang kiểm tra dữ liệu..."
                : `Đang tải video ${Math.min(prep.done + 1, prep.total)}/${prep.total} · ${percent}%`}
          </div>
          {prep.status === "retrying" && (
            <button type="button" className="preload-skip" onClick={() => setSkipped(true)}>
              Bỏ qua, dùng mạng trực tiếp
            </button>
          )}
        </div>
      )}

      <div id="app" ref={appRef}>
        <video
          id="bgVideo"
          ref={bgRef}
          src={treeVisible ? BG_VIDEO : undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        {ORNAMENTS.map((pos, index) => (
          <div
            key={pos.id}
            className="hotspot"
            ref={(el) => {
              hotspotRefs.current[index] = el;
            }}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => openRef.current(pos.id)}
          />
        ))}
      </div>

      <div id="videoLoading" className="video-loading" ref={loadingRef}>
        <svg className="svg-loader" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" />
        </svg>
        <span> </span>
        <div className="loading-text letter-step">
          {LOADING_LETTERS.map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      <div id="popupOverlay" ref={overlayRef}>
        <div id="popupBox">
          <div id="closeBtn" onClick={() => closeRef.current()}>
            ✕
          </div>
          <video id="popupVideo" ref={popupRef} muted playsInline preload="auto" />
        </div>
      </div>
    </>
  );
}
