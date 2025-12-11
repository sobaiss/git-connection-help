import { Card, CardBody } from '@heroui/react';

export default function PropertyManagementSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-4">
        <div className="bg-default-200 h-6 w-6 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="flex-1">
        <Card className="border-default-100 border bg-white shadow-sm">
          <CardBody className="p-0">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              <div className="bg-default-200 h-32 w-full flex-shrink-0 animate-pulse rounded-lg bg-gray-200 sm:w-48" />

              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="bg-default-200 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="bg-default-200 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="bg-default-200 h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                  <div className="bg-default-200 h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="bg-default-200 h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="bg-default-200 h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="bg-default-200 h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>

                <div className="flex gap-2 pt-2">
                  <div className="bg-default-200 h-9 w-24 animate-pulse rounded-full bg-gray-200" />
                  <div className="bg-default-200 h-9 w-24 animate-pulse rounded-full bg-gray-200" />
                  <div className="bg-default-200 h-9 w-24 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
