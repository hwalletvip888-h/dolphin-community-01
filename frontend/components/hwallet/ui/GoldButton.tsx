import { ArrowRight } from "lucide-react";

type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function GoldButton({ children, className = "", onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`gold-button flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-lg font-black transition hover:-translate-y-0.5 hover:brightness-110 ${className}`}
    >
      {children}
      <ArrowRight size={22} />
    </button>
  );
}
