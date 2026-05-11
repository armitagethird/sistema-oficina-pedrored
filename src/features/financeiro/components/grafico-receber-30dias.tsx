"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/shared/format/money";
import type { ParcelasProximas30Dias } from "../queries";

const HOJE = new Date();
HOJE.setHours(0, 0, 0, 0);

function shortDate(value: string): string {
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

type Row = ParcelasProximas30Dias & { total: number; isAtraso: boolean };

export function GraficoReceber30Dias({
  data,
}: {
  data: ParcelasProximas30Dias[];
}) {
  const rows: Row[] = data.map((d) => {
    const date = new Date(`${d.data}T12:00:00`);
    return {
      ...d,
      total: d.pendente + d.atrasado,
      isAtraso: date < HOJE || d.atrasado > 0,
    };
  });

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhuma parcela prevista para os próximos 30 dias.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="data"
            tickFormatter={(v) =>
              typeof v === "string" ? shortDate(v) : String(v ?? "")
            }
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) =>
              `R$${Math.round(typeof v === "number" ? v : Number(v) || 0)}`
            }
            tick={{ fontSize: 11 }}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
            labelFormatter={(label) =>
              typeof label === "string" ? shortDate(label) : String(label ?? "")
            }
            formatter={(value, name) => [
              formatBRL(typeof value === "number" ? value : Number(value) || 0),
              name === "pendente" ? "Pendente" : "Atrasado",
            ]}
          />
          <Bar dataKey="atrasado" stackId="parcela" radius={[0, 0, 0, 0]} fill="var(--destructive)" />
          <Bar dataKey="pendente" stackId="parcela" radius={[4, 4, 0, 0]}>
            {rows.map((r, i) => (
              <Cell
                key={i}
                fill={r.isAtraso ? "var(--destructive)" : "var(--primary)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
