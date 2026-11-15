import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Camera, Sparkles, Upload, VideoOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { INITIAL_PRODUCTS } from '../../data/products';
import { analyzeFaceForTryOn, fetchAiTryOnQuota } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeTryOnModal } from '../../store/slices/authSlice';
import { AiTryOnAnalysis } from '../../types/eyewear';
import { FrameOverlaySvg } from '../common/FrameOverlaySvg';

export function VirtualTryOnModal() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isVi = !i18n.language.startsWith('en');

  const { tryOnModalOpen, tryOnProductSlug, user } = useAppSelector((state) => state.auth);

  const [selectedSlug, setSelectedSlug] = useState<string>(INITIAL_PRODUCTS[0].slug);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [overlayScale, setOverlayScale] = useState(1.0);
  const [overlayOffsetY, setOverlayOffsetY] = useState(42);
  const [overlayRotate, setOverlayRotate] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number>(20);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiTryOnAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (tryOnProductSlug) {
      setSelectedSlug(tryOnProductSlug);
    }
  }, [tryOnProductSlug]);

  useEffect(() => {
    if (!tryOnModalOpen || !user) return;
    let active = true;
    void fetchAiTryOnQuota(user.uid)
      .then((q) => {
        if (active) setRemainingQuota(q.remaining);
      })
      .catch(() => {
        // Retain default quota display if network unavailable
      });
    return () => {
      active = false;
    };
  }, [tryOnModalOpen, user]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (!tryOnModalOpen || !user) return null;

  const selectedProduct =
    INITIAL_PRODUCTS.find((p) => p.slug === selectedSlug) ?? INITIAL_PRODUCTS[0];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    setUploadedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setErrorMsg(
        isVi
          ? 'Không thể truy cập camera trình duyệt. Vui lòng dùng tính năng Tải ảnh chân dung bên cạnh.'
          : 'Camera unavailable in this browser. Please upload a portrait photo instead.'
      );
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopCamera();
    dispatch(closeTryOnModal());
  };

  const captureCurrentBase64 = (): { base64: string; mimeType: string } | null => {
    if (uploadedPhoto) {
      const match = uploadedPhoto.match(/^data:(image\/\w+);base64,/);
      return { base64: uploadedPhoto, mimeType: match?.[1] ?? 'image/jpeg' };
    }
    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return { base64: canvas.toDataURL('image/jpeg', 0.85), mimeType: 'image/jpeg' };
    }
    return null;
  };

  const handleAnalyzeWithAi = async () => {
    const captured = captureCurrentBase64();
    if (!captured) {
      setErrorMsg(
        isVi
          ? 'Vui lòng bật Camera hoặc tải ảnh chân dung thẳng mặt trước khi phân tích AI.'
          : 'Please enable the camera or upload a front-facing portrait photo first.'
      );
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await analyzeFaceForTryOn({
        userId: user.uid,
        imageBase64: captured.base64,
        mimeType: captured.mimeType,
        selectedFrameName: isVi ? selectedProduct.nameVi : selectedProduct.nameEn,
      });
      setAnalysis(result);
      setRemainingQuota(result.remainingQuota);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      if (code === 'DAILY_QUOTA_EXCEEDED') {
        setErrorMsg(
          isVi
            ? 'Bạn đã dùng hết 20 lượt phân tích AI trong hôm nay. Vui lòng quay lại vào ngày mai.'
            : 'You have reached the daily limit of 20 AI analyses. Please try again tomorrow.'
        );
      } else {
        setErrorMsg(
          isVi
            ? 'Phân tích AI tạm thời gián đoạn. Bạn vẫn có thể kéo thanh căn chỉnh gọng AR trực tiếp.'
            : 'AI analysis is temporarily unavailable. You can still adjust the AR frame overlay live.'
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[#FAF9F6] p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#141413]/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#141413]">
              {t('tryOn.title')}
            </h2>
            <p className="mt-0.5 text-xs text-[#5C5A55]">
              {t('tryOn.quotaLabel')}:{' '}
              <span className="font-mono-tabular font-semibold text-[#1F3A32]">
                {remainingQuota} / 20
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close AI Try-On"
            className="rounded-lg p-2 text-[#5C5A55] hover:bg-[#EAE6DE] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* AR Try-On Viewport */}
          <div className="lg:col-span-7">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-[#141413]/10 bg-[#1B1B1A]">
              {cameraActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full -scale-x-100 object-cover"
                />
              )}

              {!cameraActive && uploadedPhoto && (
                <img
                  src={uploadedPhoto}
                  alt="Uploaded portrait"
                  className="h-full w-full object-cover"
                />
              )}

              {!cameraActive && !uploadedPhoto && (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#EAE6DE]">
                  <Camera className="mb-3 h-10 w-10 opacity-70" />
                  <p className="text-sm font-medium">
                    {isVi
                      ? 'Bật Camera hoặc Tải ảnh chân dung để ướm thử gọng kính'
                      : 'Enable live camera or upload a front-facing portrait'}
                  </p>
                </div>
              )}

              {/* Live Adjustable Eyewear AR Frame Overlay */}
              {(cameraActive || uploadedPhoto) && (
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: `${overlayOffsetY}%`,
                    width: `${Math.round(52 * overlayScale)}%`,
                    transform: `translate(-50%, -50%) rotate(${overlayRotate}deg)`,
                  }}
                >
                  <FrameOverlaySvg
                    frameStyle={selectedProduct.frameStyle}
                    colorTone={selectedProduct.colorTone}
                    className="w-full drop-shadow-md"
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172C26] cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>{t('tryOn.startCamera')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#141413]/20 bg-white px-4 py-2 text-xs font-semibold text-[#141413] cursor-pointer"
                >
                  <VideoOff className="h-4 w-4" />
                  <span>{t('tryOn.stopCamera')}</span>
                </button>
              )}

              <label className="inline-flex items-center gap-2 rounded-lg border border-[#141413]/20 bg-white px-4 py-2 text-xs font-semibold text-[#141413] hover:bg-[#F2EFE9] cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{t('tryOn.uploadPhoto')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={analyzing}
                onClick={() => void handleAnalyzeWithAi()}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#8C6D46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#745937] disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{analyzing ? t('tryOn.analyzing') : t('tryOn.analyzeBtn')}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Controls & AI Diagnosis */}
          <div className="space-y-5 lg:col-span-5">
            <div>
              <div className="text-xs font-semibold text-[#141413]">
                {isVi ? 'Chọn mẫu gọng thử nhanh' : 'Select Frame to Try'}
              </div>
              <div className="mt-2 grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {INITIAL_PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedSlug(p.slug)}
                    className={`rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer ${
                      p.slug === selectedProduct.slug
                        ? 'border-[#1F3A32] bg-[#1F3A32]/8 font-semibold text-[#141413]'
                        : 'border-[#141413]/10 bg-white text-[#5C5A55] hover:border-[#141413]/30'
                    }`}
                  >
                    <div className="truncate">{isVi ? p.nameVi : p.nameEn}</div>
                    <div className="mt-0.5 text-[11px] text-[#7A7770]">
                      {t(`filters.frameStyle.${p.frameStyle}`)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#141413]/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#141413]">{t('tryOn.adjustOverlay')}</div>
              <div className="mt-3 space-y-2.5 text-xs text-[#5C5A55]">
                <label className="flex items-center justify-between gap-3">
                  <span>{t('tryOn.scale')}</span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.45"
                    step="0.02"
                    value={overlayScale}
                    onChange={(e) => setOverlayScale(Number(e.target.value))}
                    className="w-36 accent-[#1F3A32]"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>{t('tryOn.verticalOffset')}</span>
                  <input
                    type="range"
                    min="25"
                    max="65"
                    step="1"
                    value={overlayOffsetY}
                    onChange={(e) => setOverlayOffsetY(Number(e.target.value))}
                    className="w-36 accent-[#1F3A32]"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>{t('tryOn.rotation')}</span>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="1"
                    value={overlayRotate}
                    onChange={(e) => setOverlayRotate(Number(e.target.value))}
                    className="w-36 accent-[#1F3A32]"
                  />
                </label>
              </div>
            </div>

            {analysis && (
              <div className="rounded-xl border border-[#1F3A32]/20 bg-[#F0F4F2] p-4">
                <div className="text-xs font-semibold text-[#1F3A32]">
                  {t('tryOn.recommendationTitle')}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#141413]">
                  <span>{t(`filters.faceShape.${analysis.detectedFaceShape}`)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">PD ~{analysis.estimatedPdMm} mm</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5C5A55]">
                  {isVi ? analysis.summaryVi : analysis.summaryEn}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.recommendedSlugs.map((slug) => {
                    const match = INITIAL_PRODUCTS.find((p) => p.slug === slug);
                    if (!match) return null;
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => {
                          handleClose();
                          navigate(`/san-pham/${slug}`);
                        }}
                        className="rounded-md border border-[#1F3A32]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#1F3A32] hover:bg-[#1F3A32] hover:text-white cursor-pointer"
                      >
                        {isVi ? match.nameVi : match.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
