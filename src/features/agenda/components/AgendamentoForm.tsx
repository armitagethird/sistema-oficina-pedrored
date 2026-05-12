"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAgendamento,
  getOcupacaoAction,
  updateAgendamento,
} from "../actions";
import { PERIODO_LABEL } from "../types";
import type { AgendamentoComRelacoes, OcupacaoDia } from "../types";
import { OcupacaoIndicator } from "./OcupacaoIndicator";

interface ClienteOption {
  id: string;
  nome: string;
}

interface VeiculoOption {
  id: string;
  modelo: string;
  placa: string | null;
  cliente_id: string;
}

interface Props {
  clientes: ClienteOption[];
  veiculos: VeiculoOption[];
  agendamento?: AgendamentoComRelacoes;
  dataInicial?: string;
}

export function AgendamentoForm({
  clientes,
  veiculos,
  agendamento,
  dataInicial,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clienteId, setClienteId] = useState(agendamento?.cliente_id ?? "");
  const [veiculoId, setVeiculoId] = useState(
    agendamento?.veiculo_id ?? "",
  );
  const [data, setData] = useState(agendamento?.data ?? dataInicial ?? "");
  const [periodo, setPeriodo] = useState<"manha" | "tarde">(
    agendamento?.periodo ?? "manha",
  );
  const [descricao, setDescricao] = useState(agendamento?.descricao ?? "");
  const [observacoes, setObservacoes] = useState(
    agendamento?.observacoes ?? "",
  );
  const [ocupacao, setOcupacao] = useState<OcupacaoDia | null>(null);

  const veiculosCliente = veiculos.filter((v) => v.cliente_id === clienteId);

  useEffect(() => {
    if (!data || !periodo) return;
    getOcupacaoAction(data, periodo).then((r) => {
      if (r.ok) setOcupacao(r.data);
    });
  }, [data, periodo]);

  useEffect(() => {
    if (agendamento?.cliente_id !== clienteId) setVeiculoId("");
  }, [clienteId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        cliente_id: clienteId,
        veiculo_id: veiculoId || null,
        data,
        periodo,
        descricao,
        observacoes: observacoes || null,
      };

      if (agendamento) {
        const result = await updateAgendamento(agendamento.id, input);
        if (result.ok) {
          toast.success("Agendamento atualizado");
          router.push(`/app/agenda/${agendamento.id}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createAgendamento(input);
        if (result.ok) {
          if (
            "warning" in result.data &&
            result.data.warning === "capacidade_excedida"
          ) {
            toast.warning("Agendamento criado, mas período está lotado");
          } else {
            toast.success("Agendamento criado");
          }
          router.push(`/app/agenda/${result.data.id}`);
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cliente">Cliente *</Label>
        <Select
          value={clienteId}
          onValueChange={setClienteId}
          disabled={!!agendamento}
          required
        >
          <SelectTrigger id="cliente">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="veiculo">Veículo</Label>
        <Select
          value={veiculoId}
          onValueChange={setVeiculoId}
          disabled={!clienteId}
        >
          <SelectTrigger id="veiculo">
            <SelectValue placeholder="Selecione o veículo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {veiculosCliente.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.modelo}
                {v.placa ? ` — ${v.placa}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodo">Período *</Label>
          <Select
            value={periodo}
            onValueChange={(v) => setPeriodo(v as "manha" | "tarde")}
            required
          >
            <SelectTrigger id="periodo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["manha", "tarde"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIODO_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ocupacao && (
        <OcupacaoIndicator
          ocupados={ocupacao.ocupados}
          capacidade={ocupacao.capacidade_efetiva}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição do serviço *</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Troca de óleo, revisão geral..."
          required
          minLength={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Informações adicionais..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending
            ? "Salvando..."
            : agendamento
              ? "Salvar"
              : "Criar agendamento"}
        </Button>
      </div>
    </form>
  );
}
