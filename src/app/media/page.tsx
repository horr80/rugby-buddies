import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { MediaGallery, type MediaItemDTO } from "@/components/media-modal";

export const metadata: Metadata = {
  title: "Media | Rugby Buddies",
  description: "Photos and videos from Rugby Buddies training and events.",
};

type MediaRow = {
  id: string;
  title: string;
  type: "VIDEO" | "PHOTO";
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
};

export default async function MediaPage() {
  const items = (await prisma.mediaItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })) as MediaRow[];

  const dto: MediaItemDTO[] = items.map((m: MediaRow) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl,
    description: m.description,
  }));

  return (
    <div className="grass-pattern min-h-screen">
      <div className="border-b border-green-100 bg-gradient-to-r from-[#2D5F2D] to-[#3d7a3d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Media gallery</h1>
          <p className="mt-2 max-w-2xl text-green-100">
            Catch up on highlights, training clips, and photos from Rugby Buddies.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {dto.length === 0 ? (
          <p className="rounded-xl border border-dashed border-green-200 bg-white/90 px-6 py-16 text-center text-muted-foreground">
            No media has been published yet.
          </p>
        ) : (
          <MediaGallery items={dto} />
        )}
      </div>
    </div>
  );
}
