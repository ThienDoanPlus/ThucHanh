import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signInWithGoogle } from '../../services/firebase';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeLoginModal, openTryOnModal, setUser } from '../../store/slices/authSlice';

export function AuthModal() {
  const { i18n, t } = useTranslation();
  const dispatch = useAppDispatch();
  const { loginModalOpen, loginModalReason, tryOnProductSlug } = useAppSelector(
    (state) => state.auth
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isVi = !i18n.language.startsWith('en');

  if (!loginModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const profile = await signInWithGoogle();
      dispatch(setUser(profile));
      dispatch(closeLoginModal());
      if (loginModalReason === 'AI_TRYON') {
        dispatch(openTryOnModal(tryOnProductSlug));
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : isVi
            ? 'Đăng nhập Google không thành công. Vui lòng thử lại.'
            : 'Google Sign-In failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-xl bg-[#FAF9F6] p-6 shadow-xl border border-[#141413]/10">
        <button
          type="button"
          onClick={() => dispatch(closeLoginModal())}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-[#5C5A55] hover:bg-[#EAE6DE] hover:text-[#141413] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-[#1F3A32]">
          <ShieldCheck className="h-4 w-4" />
          <span>{isVi ? 'Xác thực bảo mật Google / Gmail' : 'Secure Google / Gmail Auth'}</span>
        </div>

        <h3 className="font-display text-2xl font-semibold text-[#141413]">
          {loginModalReason === 'AI_TRYON'
            ? t('tryOn.authRequiredTitle')
            : isVi
              ? 'Đăng nhập LUMINA OPTICS'
              : 'Sign in to LUMINA OPTICS'}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#5C5A55]">
          {loginModalReason === 'AI_TRYON'
            ? t('tryOn.authRequiredDesc')
            : isVi
              ? 'Đăng nhập nhanh bằng tài khoản Google/Gmail để nhận thông báo đơn hàng qua Gmail, lưu thông số độ mắt và mở khóa AI Thử kính.'
              : 'Sign in with Google/Gmail to receive Gmail order receipts, save Rx measurements, and unlock AI Virtual Try-On.'}
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogleSignIn()}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-[#1F3A32] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172C26] disabled:opacity-60 cursor-pointer"
        >
          <span>
            {loading
              ? isVi
                ? 'Đang kết nối Google...'
                : 'Connecting to Google...'
              : isVi
                ? 'Tiếp tục với Google / Gmail'
                : 'Continue with Google / Gmail'}
          </span>
        </button>

        <p className="mt-4 text-center text-xs text-[#7A7770]">
          {isVi
            ? 'Quyền riêng tư: Ảnh chụp thử từ camera không bị lưu trữ trái phép.'
            : 'Privacy guaranteed: Try-On camera frames are never stored without consent.'}
        </p>
      </div>
    </div>
  );
}
