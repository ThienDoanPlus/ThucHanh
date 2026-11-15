import { MessageCircle, Phone } from 'lucide-react';
import { useAppSelector } from '../../store';
import { UserRole } from '../../types/eyewear';

export function SocialFloatingHub() {
  const { user } = useAppSelector((state) => state.auth);

  // Strict RBAC Isolation: hide customer floating widgets for Admin & Staff workspaces
  if (user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF) {
    return null;
  }

  return (
    <div
      className="fixed bottom-5 right-4 z-30 flex flex-col gap-2"
      aria-label="Customer support channels"
    >
      <a
        href="https://zalo.me/0901234567"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#141413]/10 bg-white text-xs font-bold text-[#0068FF] shadow-md transition-transform hover:-translate-y-0.5"
        title="Zalo OA"
      >
        Zalo
      </a>
      <a
        href="https://m.me/luminaoptics"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#141413]/10 bg-white text-[#1877F2] shadow-md transition-transform hover:-translate-y-0.5"
        title="Facebook Messenger"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href="tel:0901234567"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F3A32] text-white shadow-md transition-transform hover:-translate-y-0.5"
        title="Hotline 0901 234 567"
      >
        <Phone className="h-4 w-4" />
      </a>
    </div>
  );
}
