export function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/40 glow-blob animate-blob" />
      <div className="absolute top-20 right-1/4 h-[24rem] w-[24rem] rounded-full bg-accent/40 glow-blob animate-blob [animation-delay:3s]" />
      <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-primary/20 glow-blob animate-blob [animation-delay:6s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_60%)]" />
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
}
