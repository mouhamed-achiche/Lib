import { Skeleton } from "@/components/ui/skeleton";

export function TrendingCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="w-full aspect-square rounded mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-3" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function CatalogCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 flex flex-col flex-grow">
        <Skeleton className="h-3 w-1/3 mb-1" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <div className="mt-auto">
          <Skeleton className="h-6 w-1/2 mb-3" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
