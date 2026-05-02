import React, { useState } from "react";
import { format } from "date-fns";
import { Search, Plus, Pencil, Trash2, ExternalLink, Database, Cpu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useListEntries,
  useDeleteEntry,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Entry } from "@workspace/api-client-react/src/generated/api.schemas";
import { EntryForm } from "@/components/EntryForm";
import { DeleteDialog } from "@/components/DeleteDialog";
import { toast } from "sonner";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const listParams = debouncedSearch ? { search: debouncedSearch } : {};
  const { data: entries = [], isLoading } = useListEntries(listParams, {
    query: { queryKey: getListEntriesQueryKey(listParams) },
  });

  const deleteMutation = useDeleteEntry();

  const handleAdd = () => { setEditingEntry(null); setFormOpen(true); };
  const handleEdit = (entry: Entry) => { setEditingEntry(entry); setFormOpen(true); };
  const handleDeleteRequest = (id: number) => { setDeletingId(id); setDeleteOpen(true); };

  const confirmDelete = () => {
    if (deletingId === null) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        toast.success("Đã xóa thành công");
        setDeleteOpen(false);
        setDeletingId(null);
      },
      onError: () => toast.error("Có lỗi xảy ra khi xóa"),
    });
  };

  const validCount = entries.filter((e) => e.isValid).length;
  const invalidCount = entries.length - validCount;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col dark grid-bg">

      {/* ── Top bar ── */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ boxShadow: "0 0 8px hsl(191 97% 60%)" }} />
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">System Online</span>
            </div>
            <span className="text-border/60">|</span>
            <h1 className="font-mono font-bold text-sm tracking-tight">
              <span className="text-muted-foreground">//</span>{" "}
              <span className="text-primary text-glow">CACHE_DB</span>
              <span className="text-foreground/80"> › URL Storage</span>
            </h1>
          </div>

          {/* Right side: search + add */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="search entries..."
                className="pl-8 h-8 w-52 bg-card/50 border-border/60 font-mono text-xs placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-0 focus-visible:glow-cyan-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 px-3 font-mono text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 shadow-none"
              style={{ boxShadow: "0 0 12px rgba(0,212,255,0.08)" }}
            >
              <Plus className="h-3.5 w-3.5" />
              ADD_ENTRY
            </Button>
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="px-6 py-2 border-b border-border/40 bg-muted/20 flex items-center gap-6">
        <StatItem icon={<Database className="h-3 w-3" />} label="TOTAL" value={entries.length} />
        <StatItem icon={<Activity className="h-3 w-3" />} label="VALID" value={validCount} color="text-emerald-400" />
        <StatItem icon={<Cpu className="h-3 w-3" />} label="PENDING" value={invalidCount} color="text-amber-400" />
        {debouncedSearch && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            <span className="text-primary">›</span> filter: <span className="text-foreground/70">"{debouncedSearch}"</span>
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="border border-border/60 rounded-lg overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(0,212,255,0.04), 0 4px 24px rgba(0,0,0,0.4)" }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/60 bg-muted/30">
                <TableHead className="w-[100px] font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">Mã</TableHead>
                <TableHead className="w-[200px] font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">Từ khóa</TableHead>
                <TableHead className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">URL</TableHead>
                <TableHead className="w-[120px] font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">Trạng thái</TableHead>
                <TableHead className="w-[110px] font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">Ngày thêm</TableHead>
                <TableHead className="w-[80px] text-right font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase py-2.5">Ops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <span className="font-mono text-xs text-muted-foreground cursor-blink">Đang tải dữ liệu</span>
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground/50">[ no records found ]</span>
                      {debouncedSearch && (
                        <span className="font-mono text-[10px] text-muted-foreground/30">query: "{debouncedSearch}" returned 0 results</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
                    className="group border-b border-border/30 table-row-hover"
                  >
                    <TableCell className="py-2.5">
                      {entry.code ? (
                        <span className="font-mono text-xs text-primary/80 bg-primary/5 border border-primary/15 px-2 py-0.5 rounded">
                          {entry.code}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {entry.keyword ? (
                        <span className="font-mono text-xs text-foreground/70">{entry.keyword}</span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:text-primary/80 transition-colors group/link max-w-[380px] lg:max-w-[520px] truncate"
                      >
                        <span className="truncate">{entry.url}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-60 transition-opacity" />
                      </a>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {entry.isValid ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 4px #34d399" }} />
                          VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-amber-400 bg-amber-400/8 border border-amber-400/20 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          PENDING
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="font-mono text-[10px] text-muted-foreground/50">
                        {format(new Date(entry.createdAt), "dd/MM/yy")}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="h-6 w-6 flex items-center justify-center rounded border border-border/60 bg-card/50 hover:border-primary/40 hover:text-primary transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(entry.id)}
                          className="h-6 w-6 flex items-center justify-center rounded border border-border/60 bg-card/50 hover:border-destructive/40 hover:text-destructive transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Footer ── */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground/30">
            cache.db · {entries.length} records · {validCount} valid
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/20">
            v3.0 · URL Storage System
          </span>
        </div>
      </div>

      <EntryForm open={formOpen} onOpenChange={setFormOpen} entry={editingEntry} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={confirmDelete} isPending={deleteMutation.isPending} />
    </div>
  );
}

function StatItem({ icon, label, value, color = "text-foreground/60" }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/50">{icon}</span>
      <span className="font-mono text-[10px] text-muted-foreground/50 tracking-widest">{label}</span>
      <span className={`font-mono text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
