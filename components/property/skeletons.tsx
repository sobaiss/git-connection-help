export function PropertiesListSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/4 rounded bg-gray-200"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg bg-white shadow-md">
              <div className="aspect-[4/3] rounded-t-lg bg-gray-200"></div>
              <div className="space-y-3 p-6">
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PropertyLoadingSkeleton() {
  return (
    <div className="bg-background mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-default-600 py-20 text-center text-lg">Loading...</div>
    </div>
  );
}

export function PropertyDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - Images and Details (2 columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image Gallery Skeleton */}
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-gray-200"></div>

          {/* Property Header Skeleton */}
          <div className="animate-pulse space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-6 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="flex flex-wrap gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 w-20 rounded bg-gray-200"></div>
              ))}
            </div>
          </div>

          {/* Description Skeleton */}
          <div className="animate-pulse space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200"></div>
              <div className="h-4 w-full rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>

          {/* Amenities Skeleton */}
          <div className="animate-pulse space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-6 w-1/3 rounded bg-gray-200"></div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-gray-200"></div>
              ))}
            </div>
          </div>

          {/* Location Skeleton */}
          <div className="animate-pulse space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="h-80 w-full rounded-lg bg-gray-200"></div>
          </div>
        </div>

        {/* Contact Sidebar (1 column) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Agent Skeleton */}
          <div className="animate-pulse space-y-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              </div>
            </div>
            <div className="h-12 w-full rounded-full bg-gray-200"></div>
            <div className="h-12 w-full rounded-full bg-gray-200"></div>
          </div>

          {/* Property Stats Skeleton */}
          <div className="animate-pulse space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-6 w-2/3 rounded bg-gray-200"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
