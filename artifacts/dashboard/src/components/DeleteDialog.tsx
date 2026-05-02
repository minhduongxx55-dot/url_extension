import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteDialog({ open, onOpenChange, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 overflow-hidden border-border/60 bg-card sm:max-w-[380px]"
        style={{ boxShadow: "0 0 0 1px rgba(239,68,68,0.12), 0 24px 48px rgba(0,0,0,0.8)" }}
      >
        {/* Terminal title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-destructive/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-border/40" />
          </div>
          <span className="flex-1 text-center font-mono text-[10px] text-destructive/60 tracking-widest">
            CONFIRM_DELETE · irreversible
          </span>
        </div>

        <div className="p-5">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="font-mono text-sm flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-destructive" />
              <span className="text-foreground/90">Xác nhận xóa bản ghi?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed border-l-2 border-destructive/30 pl-3">
              Hành động này <span className="text-destructive">không thể hoàn tác</span>.
              Bản ghi sẽ bị xóa vĩnh viễn khỏi cache database.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="font-mono text-xs text-muted-foreground/60 hover:text-muted-foreground px-3 py-1.5 rounded border border-transparent hover:border-border/60 transition-colors disabled:opacity-50"
            >
              cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="font-mono text-xs text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/50 px-4 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {isPending ? "deleting..." : "rm -rf →"}
            </button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
