import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import MediaCarousel from "@/components/MediaCarousel";
import MediaUploader from "@/components/MediaUploader";
import PlatformPicker, { formatPlatforms, parsePlatforms } from "@/components/PlatformPicker";

type Brand = { id: string; name: string; color: string };
type Bucket = { id: string; name: string; color: string; brand_id: string | null };
type Item = {
  id: string; brand_id: string; title: string; platform: string; status: string;
  scheduled_at: string | null; body?: string | null; post_type?: string;
  media_urls?: string[]; bucket_id?: string | null;
};

const POST_TYPES = [
  { value: "post", label: "Static post" },
  { value: "carousel", label: "Carousel" },
  { value: "video", label: "Video" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
];
const STATUSES = ["idea","ready","scheduled","posted"];

export default function Content() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<"calendar"|"kanban">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Item | null>(null);
  const [showBucketDialog, setShowBucketDialog] = useState(false);

  const load = async () => {
    const [b, bk, i] = await Promise.all([
      supabase.from("brands").select("id,name,color"),
      supabase.from("content_buckets").select("*").order("created_at"),
      supabase.from("content_items").select("*").order("scheduled_at", { ascending: true, nullsFirst: false }),
    ]);
    setBrands(b.data ?? []);
    setBuckets((bk.data ?? []) as Bucket[]);
    setItems((i.data ?? []) as Item[]);
  };
  useEffect(() => { load(); }, []);

  const brandOf = (id: string) => brands.find(b => b.id === id);
  const bucketOf = (id?: string | null) => id ? buckets.find(b => b.id === id) : undefined;

  const today = new Date(); today.setHours(0,0,0,0);
  const [monthOffset, setMonthOffset] = useState(0);
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const startWeekday = (viewMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i=0;i<startWeekday;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  const filteredItems = useMemo(() => items.filter(i =>
    (brandFilter === "all" || i.brand_id === brandFilter) &&
    (bucketFilter === "all" || i.bucket_id === bucketFilter)
  ), [items, brandFilter, bucketFilter]);

  const itemsForDate = (d: Date | null) =>
    d ? filteredItems.filter(i => i.scheduled_at && new Date(i.scheduled_at).toDateString() === d.toDateString()) : [];

  const selectedItems = itemsForDate(selectedDate);

  const downloadHtml = () => {
    const monthName = viewMonth.toLocaleDateString(undefined,{ month:"long", year:"numeric" });
    const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
    const monthItems = filteredItems.filter(i => i.scheduled_at && new Date(i.scheduled_at).getMonth() === viewMonth.getMonth() && new Date(i.scheduled_at).getFullYear() === viewMonth.getFullYear());
    const enriched = monthItems.map(i => ({
      ...i,
      brand: brandOf(i.brand_id),
      bucket: bucketOf(i.bucket_id),
      platforms: parsePlatforms(i.platform),
    }));
    const dataJson = JSON.stringify(enriched).replace(/</g, "\\u003c");
    const rows = cells.map(d => {
      if (!d) return `<td class="empty"></td>`;
      const dayItems = itemsForDate(d);
      const lis = dayItems.map(i => {
        const b = brandOf(i.brand_id);
        return `<li data-id="${i.id}" style="background:${b?.color ?? "#888"}" title="${esc(i.title)}">${esc(i.title)}</li>`;
      }).join("");
      return `<td><div class="d">${d.getDate()}</div><ul>${lis}</ul></td>`;
    });
    const weeks: string[] = [];
    for (let i=0;i<rows.length;i+=7) weeks.push(`<tr>${rows.slice(i,i+7).join("")}</tr>`);
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calendar — ${esc(monthName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;background:#fafafa;color:#111;margin:0}
  h1{font-weight:600;margin:0 0 16px;font-size:24px}
  table{width:100%;border-collapse:separate;border-spacing:4px;table-layout:fixed}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#777;text-align:left;padding:4px 8px}
  td{vertical-align:top;height:120px;background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:6px}
  td.empty{background:transparent;border:none}
  .d{font-size:11px;color:#777;margin-bottom:4px}
  ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:3px}
  li{font-size:10px;color:#fff;padding:3px 6px;border-radius:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
  li:hover{opacity:.85}
  .modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
  .modal.open{display:flex}
  .sheet{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .close{float:right;background:none;border:none;font-size:22px;cursor:pointer;color:#888;line-height:1}
  .tag{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:999px;color:#fff;margin-right:6px;margin-bottom:6px}
  .meta{font-size:12px;color:#666;margin:8px 0}
  .body{font-size:14px;white-space:pre-wrap;color:#333;margin:12px 0}
  .media{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:12px}
  .media img,.media video{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#000;cursor:pointer}
  .media a{display:block;font-size:11px;color:#0A84FF;text-decoration:none;margin-top:4px;text-align:center}
  h2{margin:0 0 6px;font-size:18px}
  @media (max-width:640px){
    body{padding:12px}
    td{height:80px;padding:4px}
    li{font-size:9px}
    th{font-size:10px;padding:2px 4px}
  }
</style></head>
<body><h1>${esc(monthName)}</h1>
<table><thead><tr>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>`<th>${d}</th>`).join("")}</tr></thead>
<tbody>${weeks.join("")}</tbody></table>
<div class="modal" id="m" onclick="if(event.target.id==='m')this.classList.remove('open')"><div class="sheet" id="s"></div></div>
<script>
const items = ${dataJson};
const byId = Object.fromEntries(items.map(i => [i.id, i]));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]));
const isVid = u => /\\.(mp4|webm|mov|m4v|ogg)(\\?|$)/i.test(u);
const resolvePreviewUrl = u => {
  const normalized = String(u ?? "").replace(/\\\\/g, '/');
  if (!normalized) return '/image.png';
  if (normalized.includes('nopreview.png')) return '/image.png';
  return normalized.replace(/^\\/?public\\//, '/');
};
function open(id){
  const i = byId[id]; if(!i) return;
  const media = (i.media_urls||[]).map(u => {
    const src = resolvePreviewUrl(u);
    return isVid(src)
    ? '<div><video src="'+esc(src)+'" controls></video><a href="'+esc(src)+'" download target="_blank">Download</a></div>'
    : '<div><img src="'+esc(src)+'" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied=\'true\';this.src=\'/image.png\';}" onclick="window.open(this.src)"><a href="'+esc(src)+'" download target="_blank">Download</a></div>'
  }
  ).join("");
  const date = i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "";
  document.getElementById('s').innerHTML =
    '<button class="close" onclick="document.getElementById(\\'m\\').classList.remove(\\'open\\')">×</button>'+
    (i.brand ? '<span class="tag" style="background:'+esc(i.brand.color)+'">'+esc(i.brand.name)+'</span>' : '')+
    (i.bucket ? '<span class="tag" style="background:'+esc(i.bucket.color)+'">'+esc(i.bucket.name)+'</span>' : '')+
    '<span class="tag" style="background:#444">'+esc(i.post_type||'post')+'</span>'+
    '<span class="tag" style="background:#888">'+esc(i.status)+'</span>'+
    '<h2>'+esc(i.title)+'</h2>'+
    '<div class="meta">'+esc((i.platforms||[]).join(' · '))+(date?' · '+esc(date):'')+'</div>'+
    (i.body ? '<div class="body">'+esc(i.body)+'</div>' : '')+
    (media ? '<div class="media">'+media+'</div>' : '');
  document.getElementById('m').classList.add('open');
}
document.querySelectorAll('li[data-id]').forEach(el => el.addEventListener('click', () => open(el.dataset.id)));
document.addEventListener('keydown', e => { if(e.key==='Escape') document.getElementById('m').classList.remove('open'); });
</script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `calendar-${viewMonth.getFullYear()}-${String(viewMonth.getMonth()+1).padStart(2,"0")}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setEditing(null); setSelectedDate(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-4xl">Content</h2>
          <p className="text-sm text-muted-foreground mt-1">All content across all brands.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All brands" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />{b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bucketFilter} onValueChange={setBucketFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All buckets" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buckets</SelectItem>
              {buckets.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />{b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowBucketDialog(true)}><Plus className="size-4" />Bucket</Button>
          <Button variant="outline" size="sm" onClick={downloadHtml}><Download className="size-4" />HTML</Button>
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            {(["calendar","kanban"] as const).map(v => (
              <Button key={v} variant={view===v?"default":"ghost"} size="sm" onClick={() => setView(v)} className="capitalize">{v}</Button>
            ))}
          </div>
        </div>
      </div>

      <BucketsBar buckets={buckets} items={items} onChanged={load} />

      {view === "calendar" ? (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setMonthOffset(m => m-1)}>←</Button>
            <div className="text-sm font-medium">{viewMonth.toLocaleDateString(undefined,{month:"long", year:"numeric"})}</div>
            <Button variant="ghost" size="sm" onClick={() => setMonthOffset(m => m+1)}>→</Button>
          </div>
          <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="px-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} className="h-24 rounded-lg bg-transparent" />;
              const dayItems = itemsForDate(d);
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`h-24 rounded-lg border p-1.5 overflow-hidden text-left transition-all hover:border-primary/60 hover:shadow-sm ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className={`text-[11px] ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>{d.getDate()}</div>
                  <div className="space-y-1 mt-1">
                    {dayItems.slice(0,3).map(i => {
                      const b = brandOf(i.brand_id);
                      return (
                        <div key={i.id} className="text-[10px] px-1.5 py-0.5 rounded text-white truncate" style={{ backgroundColor: b?.color ?? "hsl(var(--muted-foreground))" }} title={i.title}>
                          {i.title}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayItems.length - 3} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {STATUSES.map(col => (
            <div key={col} className="surface-card p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">{col}</div>
              <div className="space-y-2">
                {filteredItems.filter(i => i.status === col).map(i => {
                  const b = brandOf(i.brand_id);
                  return (
                    <button key={i.id} onClick={() => setEditing(i)} className="w-full text-left bg-secondary rounded-lg p-3 hover:ring-1 hover:ring-primary/40">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        {b && <span className="size-1.5 rounded-full" style={{ backgroundColor: b.color }} />}{b?.name}
                      </div>
                      <div className="text-sm font-medium mt-1">{i.title}</div>
                      <div className="text-[11px] text-muted-foreground">{parsePlatforms(i.platform).join(" · ")}{i.scheduled_at && ` · ${new Date(i.scheduled_at).toLocaleDateString()}`}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDate} onOpenChange={(o) => !o && setSelectedDate(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDate?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No content scheduled for this date.</p>
            ) : selectedItems.map(i => {
              const b = brandOf(i.brand_id);
              const bk = bucketOf(i.bucket_id);
              return (
                <div key={i.id} className="surface-card p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground flex-wrap">
                      {b && <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />}
                      <span>{b?.name}</span>
                      {bk && <><span>·</span><span style={{ color: bk.color }}>{bk.name}</span></>}
                      <span>·</span>
                      <span>{parsePlatforms(i.platform).join(", ")}</span>
                    </div>
                    <Badge variant="secondary" className="capitalize">{i.status}</Badge>
                  </div>
                  {i.media_urls && i.media_urls.length > 0 && <MediaCarousel urls={i.media_urls} />}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">{i.post_type ?? "post"}</span>
                    <div className="font-medium">{i.title}</div>
                  </div>
                  {i.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{i.body}</p>}
                  {i.scheduled_at && (
                    <div className="text-xs text-muted-foreground">Scheduled · {new Date(i.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(i); setSelectedDate(null); }}><Pencil className="size-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteItem(i.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {editing && (
        <EditDialog
          item={editing}
          brands={brands}
          buckets={buckets}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          onDelete={() => deleteItem(editing.id)}
        />
      )}

      <BucketDialog open={showBucketDialog} onOpenChange={setShowBucketDialog} brands={brands} onCreated={load} />
    </div>
  );
}

function BucketsBar({ buckets, items, onChanged }: { buckets: Bucket[]; items: Item[]; onChanged: () => void }) {
  if (!buckets.length) return null;
  const del = async (id: string) => {
    if (!confirm("Delete this bucket? Items will remain but be ungrouped.")) return;
    await supabase.from("content_items").update({ bucket_id: null }).eq("bucket_id", id);
    const { error } = await supabase.from("content_buckets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };
  return (
    <div className="surface-card p-3 flex flex-wrap gap-2">
      {buckets.map(b => {
        const count = items.filter(i => i.bucket_id === b.id).length;
        return (
          <div key={b.id} className="group flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary text-xs">
            <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />
            <span className="font-medium">{b.name}</span>
            <span className="text-muted-foreground">{count}</span>
            <button onClick={() => del(b.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
          </div>
        );
      })}
    </div>
  );
}

function BucketDialog({ open, onOpenChange, brands, onCreated }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0A84FF");
  const [brandId, setBrandId] = useState<string>("none");
  const create = async () => {
    if (!name.trim()) return toast.error("Name required");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("content_buckets").insert({
      user_id: u.user.id, name: name.trim(), color, brand_id: brandId === "none" ? null : brandId,
    });
    if (error) return toast.error(error.message);
    setName(""); setColor("#0A84FF"); setBrandId("none");
    onOpenChange(false); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New content bucket</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Launch campaign, Reels series" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 p-1" />
            </div>
            <div className="space-y-1.5">
              <Label>Brand (optional)</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any brand</SelectItem>
                  {brands.map((b: Brand) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ item, brands, buckets, onClose, onSaved, onDelete }: {
  item: Item; brands: Brand[]; buckets: Bucket[]; onClose: () => void; onSaved: () => void; onDelete: () => void;
}) {
  const toLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [form, setForm] = useState({
    title: item.title,
    body: item.body ?? "",
    brand_id: item.brand_id,
    bucket_id: item.bucket_id ?? "none",
    platforms: parsePlatforms(item.platform),
    post_type: item.post_type ?? "post",
    status: item.status,
    scheduled_at: toLocal(item.scheduled_at),
    media_urls: item.media_urls ?? [],
  });
  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    if (!form.platforms.length) return toast.error("Pick at least one platform");
    const { error } = await supabase.from("content_items").update({
      title: form.title.trim(),
      body: form.body.trim() || null,
      brand_id: form.brand_id,
      bucket_id: form.bucket_id === "none" ? null : form.bucket_id,
      platform: formatPlatforms(form.platforms),
      post_type: form.post_type,
      status: form.status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      media_urls: form.media_urls,
    }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit content</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label>Caption / body</Label>
            <Textarea rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={form.brand_id} onValueChange={v => setForm({...form, brand_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bucket</Label>
              <Select value={form.bucket_id} onValueChange={v => setForm({...form, bucket_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No bucket</SelectItem>
                  {buckets.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Post type</Label>
              <Select value={form.post_type} onValueChange={v => setForm({...form, post_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Scheduled</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Platforms</Label>
              <PlatformPicker value={form.platforms} onChange={p => setForm({...form, platforms: p})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Media</Label>
            <MediaUploader value={form.media_urls} onChange={urls => setForm({...form, media_urls: urls})} />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={onDelete}><Trash2 className="size-4" />Delete</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
