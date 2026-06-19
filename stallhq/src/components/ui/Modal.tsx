"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 glass-overlay z-50" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col scale-in`}
        >
          {title && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              <Dialog.Close asChild>
                <button className="icon-button" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-5">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
