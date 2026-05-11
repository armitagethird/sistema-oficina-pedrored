"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LinkForm } from "./link-form";

type RegistrarLinkDialogProps = {
  clienteId?: string;
  osId?: string;
  trigger?: React.ReactNode;
};

export function RegistrarLinkDialog({
  clienteId,
  osId,
  trigger,
}: RegistrarLinkDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <PlusIcon className="mr-1 size-4" />
            Registrar link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar link Mercado Livre</DialogTitle>
        </DialogHeader>
        <LinkForm
          initialClienteId={clienteId}
          initialOsId={osId}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
