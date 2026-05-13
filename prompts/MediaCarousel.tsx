import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { isVideo } from "./MediaUploader";

export default function MediaCarousel({ urls }: { urls: string[] }) {
  const [i, setI] = useState(0);
  if (!urls?.length) return null;
  const resolvePreviewUrl = (input: string) => {
    const normalized = String(input ?? "").replace(/\\/g, "/");
    if (!normalized) return "/image.png";
    if (normalized.includes("nopreview.png")) return "/image.png";
    return normalized.replace(/^\/?public\//, "/");
  };
  const url = resolvePreviewUrl(urls[i]);
  const prev = () => setI(p => (p - 1 + urls.length) % urls.length);
  const next = () => setI(p => (p + 1) % urls.length);
  const download = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop()?.split("?")[0] || "media";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      window.open(url, "_blank");
    }
  };
  return (
    <div className="space-y-2">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
        {isVideo(url)
          ? <video src={url} controls className="w-full h-full object-contain bg-black" />
          : <img
              src={url}
              alt=""
              className="w-full h-full object-contain bg-black"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied === "true") return;
                img.dataset.fallbackApplied = "true";
                img.src = "/image.png";
              }}
            />}
        <button onClick={download} title="Download" className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow"><Download className="size-4" /></button>
        {urls.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow"><ChevronLeft className="size-4" /></button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow"><ChevronRight className="size-4" /></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {urls.map((_, idx) => (
                <span key={idx} className={`size-1.5 rounded-full ${idx === i ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {urls.length > 1 && <div className="text-xs text-center text-muted-foreground">{i + 1} / {urls.length}</div>}
    </div>
  );
}
