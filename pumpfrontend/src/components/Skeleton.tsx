export const Skeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4"></div>
      <div className="space-y-3 mt-4">
        <div className="h-4 bg-white/10 rounded"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
      </div>
    </div>
  );
}; 