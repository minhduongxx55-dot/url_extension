import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Entry } from "@workspace/api-client-react";
import { useCreateEntry, useUpdateEntry, getListEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hash, Tag, Link2, ShieldCheck } from "lucide-react";

const normalizeUrl = (val: unknown) => {
  if (typeof val === "string" && val.trim() && !/^https?:\/\//i.test(val.trim())) {
    return "https://" + val.trim();
  }
  return val;
};

const entrySchema = z.object({
  code: z.string().optional(),
  keyword: z.string().optional(),
  url: z.preprocess(normalizeUrl, z.string().url("URL không hợp lệ").min(1, "URL là bắt buộc")),
  isValid: z.boolean().default(true),
});

type EntryFormValues = z.infer<typeof entrySchema>;

interface EntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry | null;
}

export function EntryForm({ open, onOpenChange, entry }: EntryFormProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { code: "", keyword: "", url: "", isValid: true },
  });

  useEffect(() => {
    if (open && entry) {
      form.reset({ code: entry.code || "", keyword: entry.keyword || "", url: entry.url, isValid: entry.isValid });
    } else if (open && !entry) {
      form.reset({ code: "", keyword: "", url: "", isValid: true });
    }
  }, [open, entry, form]);

  const onSubmit = (data: EntryFormValues) => {
    const payload = { code: data.code || null, keyword: data.keyword || null, url: data.url, isValid: data.isValid };
    if (entry) {
      updateMutation.mutate({ id: entry.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          toast.success("Đã cập nhật thành công");
          onOpenChange(false);
        },
        onError: () => toast.error("Có lỗi xảy ra khi cập nhật"),
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          toast.success("Đã thêm thành công");
          onOpenChange(false);
        },
        onError: () => toast.error("Có lỗi xảy ra khi thêm mới"),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEdit = !!entry;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-border/60 bg-card"
        style={{ boxShadow: "0 0 0 1px rgba(0,212,255,0.08), 0 24px 48px rgba(0,0,0,0.8), 0 0 40px rgba(0,212,255,0.05)" }}
      >
        {/* Terminal title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="flex-1 text-center font-mono text-[10px] text-muted-foreground/60 tracking-widest">
            {isEdit ? "EDIT_ENTRY" : "NEW_ENTRY"} · cache.db
          </span>
        </div>

        <div className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase flex items-center gap-1">
                      <Hash className="h-2.5 w-2.5" /> Mã nhiệm vụ
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="vd: 20"
                        className="font-mono text-xs h-8 bg-background/50 border-border/60 focus-visible:border-primary/40 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-mono text-[10px]" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="keyword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> Từ khóa
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="vd: EE88"
                        className="font-mono text-xs h-8 bg-background/50 border-border/60 focus-visible:border-primary/40 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-mono text-[10px]" />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase flex items-center gap-1">
                    <Link2 className="h-2.5 w-2.5" /> URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ee88.com hoặc https://ee88.com"
                      className="font-mono text-xs h-8 bg-background/50 border-border/60 focus-visible:border-primary/40 focus-visible:ring-0 placeholder:text-muted-foreground/30 text-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-mono text-[10px]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="isValid" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded border border-border/50 bg-background/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <FormLabel className="font-mono text-xs text-muted-foreground/80 cursor-pointer">
                      is_valid
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="font-mono text-xs text-muted-foreground/60 hover:text-muted-foreground px-3 py-1.5 rounded border border-transparent hover:border-border/60 transition-colors"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="font-mono text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 px-4 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 0 10px rgba(0,212,255,0.1)" }}
                >
                  {isPending ? "saving..." : isEdit ? "update →" : "insert →"}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
