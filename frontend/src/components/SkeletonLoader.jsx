/**
 * SkeletonLoader - Premium shimmer loading states.
 * Provides various skeleton types for cards, charts, tables, etc.
 * Uses Tailwind's animate-pulse for a smooth shimmer effect.
 */

// Base shimmer block
const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl ${className}`} />
);

// Stat card skeleton
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-8 w-20" />
      </div>
      <Shimmer className="w-10 h-10 rounded-xl" />
    </div>
    <Shimmer className="h-3 w-32" />
  </div>
);

// Chart area skeleton
export const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card space-y-6">
    <div className="space-y-2">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="h-3 w-56" />
    </div>
    <div className="h-64 flex items-end gap-3 px-4">
      {[40, 60, 30, 75, 55, 45, 80, 50].map((h, i) => (
        <Shimmer key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

// Session row skeleton
export const SessionRowSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Shimmer className="w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-48" />
      </div>
    </div>
    <div className="flex gap-2">
      <Shimmer className="h-9 w-20 rounded-xl" />
      <Shimmer className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);

// Full dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="p-8 space-y-10 animate-fade-in">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Shimmer className="h-7 w-40" />
        <Shimmer className="h-4 w-72" />
      </div>
      <Shimmer className="h-10 w-36 rounded-lg" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Sessions */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-4 w-32" />
      </div>
      {[...Array(3)].map((_, i) => <SessionRowSkeleton key={i} />)}
    </div>
  </div>
);

// Analytics page skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header */}
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 p-6">
      <Shimmer className="h-7 w-32 mb-2" />
      <Shimmer className="h-4 w-80" />
    </div>

    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  </div>
);

// Generic page skeleton (for lazy-loaded pages)
export const PageSkeleton = () => (
  <div className="p-8 space-y-6 animate-fade-in">
    <div className="space-y-2">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="h-4 w-80" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card space-y-6">
      <Shimmer className="h-5 w-64" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-40 w-full rounded-xl" />
    </div>
  </div>
);

export default {
  StatCardSkeleton,
  ChartSkeleton,
  SessionRowSkeleton,
  DashboardSkeleton,
  AnalyticsSkeleton,
  PageSkeleton,
};
