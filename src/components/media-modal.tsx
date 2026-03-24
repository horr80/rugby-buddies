"use client";

import { useState, useMemo } from "react";
import { Play } from "lucide-react";
import { getYouTubeThumbnail, getYouTubeEmbedUrl, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export type MediaItemDTO = {
  id: string;
  title: string;
  type: "VIDEO" | "PHOTO";
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
};

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

function getVideoEmbedSrc(url: string): string | null {
  return getYouTubeEmbedUrl(url) ?? getVimeoEmbedUrl(url);
}

function resolveThumbnail(item: MediaItemDTO): string | null {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.type === "VIDEO") {
    const yt = getYouTubeThumbnail(item.url);
    if (yt) return yt;
  }
  return null;
}

type MediaModalProps = {
  item: MediaItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MediaModal({ item, open, onOpenChange }: MediaModalProps) {
  const embedSrc = item && item.type === "VIDEO" ? getVideoEmbedSrc(item.url) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto border-green-800/30 bg-zinc-950 text-white sm:max-w-3xl",
          item?.type === "PHOTO" && "sm:max-w-4xl"
        )}
      >
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 font-heading text-xl text-white">{item.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {item.type === "VIDEO" && embedSrc && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={`${embedSrc}?autoplay=1`}
                    title={item.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {item.type === "VIDEO" && !embedSrc && (
                <p className="text-sm text-zinc-400">
                  This video URL could not be embedded.{" "}
                  <a href={item.url} className="text-[#D4A843] underline" target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </p>
              )}
              {item.type === "PHOTO" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.title}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              )}
              {item.description && <p className="text-sm text-zinc-300">{item.description}</p>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type MediaGalleryProps = {
  items: MediaItemDTO[];
};

export function MediaGallery({ items }: MediaGalleryProps) {
  const [active, setActive] = useState<MediaItemDTO | null>(null);
  const [open, setOpen] = useState(false);

  const openItem = (item: MediaItemDTO) => {
    setActive(item);
    setOpen(true);
  };

  const thumbs = useMemo(() => items.map((i) => ({ item: i, thumb: resolveThumbnail(i) })), [items]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {thumbs.map(({ item, thumb }) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openItem(item)}
            className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843] focus-visible:ring-offset-2 rounded-xl"
          >
            <Card className="h-full overflow-hidden border-green-200/80 transition-shadow group-hover:shadow-lg">
              <div className="relative aspect-video w-full bg-zinc-900">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2D5F2D] to-zinc-900 text-zinc-500">
                    <span className="text-sm">No preview</span>
                  </div>
                )}
                {item.type === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A843] text-[#2D5F2D] shadow-lg">
                      <Play className="h-7 w-7 fill-current" />
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-heading font-semibold text-green-900 line-clamp-2">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <MediaModal item={active} open={open} onOpenChange={setOpen} />
    </>
  );
}
