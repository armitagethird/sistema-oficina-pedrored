"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { atualizarConfig } from "../actions";
import { configWhatsappSchema, type ConfigWhatsappInput } from "../schemas";

interface Props {
  defaults: {
    oleo_km_intervalo: number;
    oleo_km_antecedencia: number;
    oleo_km_dia: number;
  };
}

export function WhatsappConfigForm({ defaults }: Props) {
  const [pending, start] = useTransition();
  const form = useForm<ConfigWhatsappInput>({
    resolver: zodResolver(configWhatsappSchema),
    defaultValues: defaults,
  });

  function onSubmit(values: ConfigWhatsappInput) {
    start(async () => {
      const result = await atualizarConfig(values);
      if (!result.ok) {
        toast.error(result.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Configurações atualizadas");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="oleo_km_intervalo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervalo de troca de óleo (km)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Distância padrão (km) entre trocas. Default 10000.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="oleo_km_antecedencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avisar com antecedência (km)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Disparar lembrete quando faltar X km para a troca prevista.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="oleo_km_dia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Km/dia médio</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Usado para estimar km atual entre as visitas. Default 30.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" disabled={pending} size="sm">
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
