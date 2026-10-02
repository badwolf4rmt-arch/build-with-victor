import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-card p-8 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          <DialogPrimitive.Title className="font-display text-[32px] font-semibold leading-10">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-3 text-sm text-foreground/80">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
          {children}
          <DialogPrimitive.Close
            aria-label="Закрыть"
            className="absolute -right-10 top-0 hidden text-card opacity-90 transition-opacity hover:opacity-100 sm:block"
          >
            <X className="size-6" />
          </DialogPrimitive.Close>
          <DialogPrimitive.Close
            aria-label="Закрыть"
            className="absolute right-5 top-5 text-muted-foreground sm:hidden"
          >
            <X className="size-6" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ModalActions({
  onCancel,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  onCancel: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button
        onClick={onCancel}
        className="h-12 rounded-xl bg-secondary text-sm font-semibold transition-colors hover:bg-muted"
      >
        Отменить
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
