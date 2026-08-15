import LogoPreloader from '@/components/LogoPreloader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-xs">
      <LogoPreloader
        size="lg"
        text="Loading Sparrow Sports..."
        showText={true}
      />
    </div>
  );
}
