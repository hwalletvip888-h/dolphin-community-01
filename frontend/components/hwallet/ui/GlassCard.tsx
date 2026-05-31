type Props = {
  children: React.ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: Props) {
  return (
    <section className={`hwallet-panel rounded-[32px] ${className}`}>
      {children}
    </section>
  );
}
