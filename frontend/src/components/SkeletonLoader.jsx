export function PostSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="skeleton-avatar" />
        <div className="flex-1">
          <div className="skeleton-text w-1/2" />
          <div className="skeleton-text short w-1/3 mt-1" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="skeleton-text" />
        <div className="skeleton-text" />
        <div className="skeleton-text short w-2/3" />
      </div>
      <div className="h-48 bg-gray-700 skeleton rounded-lg" />
    </div>
  );
}

export function PostSkeletonLoader() {
  return (
    <div>
      {[...Array(3)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full skeleton mx-auto mb-3" />
        <div className="skeleton-text w-1/2 mx-auto" />
        <div className="skeleton-text short w-1/3 mx-auto mt-2" />
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function MusicSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="w-full aspect-square bg-gray-700 skeleton rounded-lg" />
          <div className="skeleton-text" />
          <div className="skeleton-text short w-2/3" />
        </div>
      ))}
    </div>
  );
}
