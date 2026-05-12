export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias_estoque: {
        Row: {
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          atualizado_em: string
          cpf: string | null
          criado_em: string
          deletado_em: string | null
          email: string | null
          endereco: Json | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          cpf?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          cpf?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          atualizado_em: string
          cnpj: string | null
          criado_em: string
          deletado_em: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      itens_estoque: {
        Row: {
          alerta_minimo: number
          ativo: boolean
          atualizado_em: string
          categoria_id: string
          criado_em: string
          custo_medio: number
          deletado_em: string | null
          descricao: string
          id: string
          observacoes: string | null
          preco_venda: number
          quantidade_atual: number
          sku: string | null
          unidade: string
        }
        Insert: {
          alerta_minimo?: number
          ativo?: boolean
          atualizado_em?: string
          categoria_id: string
          criado_em?: string
          custo_medio?: number
          deletado_em?: string | null
          descricao: string
          id?: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_atual?: number
          sku?: string | null
          unidade?: string
        }
        Update: {
          alerta_minimo?: number
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string
          criado_em?: string
          custo_medio?: number
          deletado_em?: string | null
          descricao?: string
          id?: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_atual?: number
          sku?: string | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_estoque_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      links_afiliado_enviados: {
        Row: {
          cliente_id: string
          comissao_estimada: number | null
          comissao_recebida: number | null
          data_comissao: string | null
          data_compra: string | null
          data_envio: string
          descricao_peca: string
          id: string
          link: string
          observacoes: string | null
          os_id: string | null
          preco_estimado: number | null
          status: Database["public"]["Enums"]["link_afiliado_status"]
        }
        Insert: {
          cliente_id: string
          comissao_estimada?: number | null
          comissao_recebida?: number | null
          data_comissao?: string | null
          data_compra?: string | null
          data_envio?: string
          descricao_peca: string
          id?: string
          link: string
          observacoes?: string | null
          os_id?: string | null
          preco_estimado?: number | null
          status?: Database["public"]["Enums"]["link_afiliado_status"]
        }
        Update: {
          cliente_id?: string
          comissao_estimada?: number | null
          comissao_recebida?: number | null
          data_comissao?: string | null
          data_compra?: string | null
          data_envio?: string
          descricao_peca?: string
          id?: string
          link?: string
          observacoes?: string | null
          os_id?: string | null
          preco_estimado?: number | null
          status?: Database["public"]["Enums"]["link_afiliado_status"]
        }
        Relationships: [
          {
            foreignKeyName: "links_afiliado_enviados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_afiliado_enviados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "view_contas_a_receber"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "links_afiliado_enviados_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_afiliado_enviados_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          ajuste_motivo: string | null
          criado_em: string
          custo_unitario: number | null
          id: string
          item_id: string
          os_id: string | null
          os_peca_id: string | null
          pedido_fornecedor_id: string | null
          pedido_loja_id: string | null
          quantidade: number
          saldo_apos: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
        }
        Insert: {
          ajuste_motivo?: string | null
          criado_em?: string
          custo_unitario?: number | null
          id?: string
          item_id: string
          os_id?: string | null
          os_peca_id?: string | null
          pedido_fornecedor_id?: string | null
          pedido_loja_id?: string | null
          quantidade: number
          saldo_apos: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
        }
        Update: {
          ajuste_motivo?: string | null
          criado_em?: string
          custo_unitario?: number | null
          id?: string
          item_id?: string
          os_id?: string | null
          os_peca_id?: string | null
          pedido_fornecedor_id?: string | null
          pedido_loja_id?: string | null
          quantidade?: number
          saldo_apos?: number
          tipo?: Database["public"]["Enums"]["movimentacao_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "view_itens_abaixo_minimo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_os_peca_id_fkey"
            columns: ["os_peca_id"]
            isOneToOne: false
            referencedRelation: "os_pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_pedido_fornecedor_id_fkey"
            columns: ["pedido_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "pedidos_fornecedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_pedido_fornecedor_id_fkey"
            columns: ["pedido_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["pedido_id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          deletado_em: string | null
          descricao_problema: string
          fechado_em: string | null
          id: string
          km_entrada: number | null
          km_saida: number | null
          numero: number
          observacoes: string | null
          status: Database["public"]["Enums"]["os_status"]
          total_geral: number
          total_pecas: number
          total_servicos: number
          veiculo_id: string
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          deletado_em?: string | null
          descricao_problema: string
          fechado_em?: string | null
          id?: string
          km_entrada?: number | null
          km_saida?: number | null
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          total_geral?: number
          total_pecas?: number
          total_servicos?: number
          veiculo_id: string
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          deletado_em?: string | null
          descricao_problema?: string
          fechado_em?: string | null
          id?: string
          km_entrada?: number | null
          km_saida?: number | null
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          total_geral?: number
          total_pecas?: number
          total_servicos?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "view_contas_a_receber"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "ordens_servico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_fotos: {
        Row: {
          criado_em: string
          id: string
          legenda: string | null
          momento: Database["public"]["Enums"]["foto_momento"]
          os_id: string
          storage_path: string
        }
        Insert: {
          criado_em?: string
          id?: string
          legenda?: string | null
          momento: Database["public"]["Enums"]["foto_momento"]
          os_id: string
          storage_path: string
        }
        Update: {
          criado_em?: string
          id?: string
          legenda?: string | null
          momento?: Database["public"]["Enums"]["foto_momento"]
          os_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_fotos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_fotos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      os_pecas: {
        Row: {
          criado_em: string
          custo_unitario: number
          descricao: string
          fornecedor_nome: string | null
          id: string
          item_estoque_id: string | null
          link_ml: string | null
          ordem: number
          origem: Database["public"]["Enums"]["peca_origem"]
          os_id: string
          preco_venda_unitario: number
          quantidade: number
          status: Database["public"]["Enums"]["peca_status"]
          subtotal_venda: number | null
        }
        Insert: {
          criado_em?: string
          custo_unitario?: number
          descricao: string
          fornecedor_nome?: string | null
          id?: string
          item_estoque_id?: string | null
          link_ml?: string | null
          ordem?: number
          origem?: Database["public"]["Enums"]["peca_origem"]
          os_id: string
          preco_venda_unitario: number
          quantidade?: number
          status?: Database["public"]["Enums"]["peca_status"]
          subtotal_venda?: number | null
        }
        Update: {
          criado_em?: string
          custo_unitario?: number
          descricao?: string
          fornecedor_nome?: string | null
          id?: string
          item_estoque_id?: string | null
          link_ml?: string | null
          ordem?: number
          origem?: Database["public"]["Enums"]["peca_origem"]
          os_id?: string
          preco_venda_unitario?: number
          quantidade?: number
          status?: Database["public"]["Enums"]["peca_status"]
          subtotal_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "os_pecas_item_estoque_id_fkey"
            columns: ["item_estoque_id"]
            isOneToOne: false
            referencedRelation: "itens_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_item_estoque_id_fkey"
            columns: ["item_estoque_id"]
            isOneToOne: false
            referencedRelation: "view_itens_abaixo_minimo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      os_servicos: {
        Row: {
          criado_em: string
          descricao: string
          id: string
          ordem: number
          os_id: string
          quantidade: number
          subtotal: number | null
          valor_unitario: number
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: string
          ordem?: number
          os_id: string
          quantidade?: number
          subtotal?: number | null
          valor_unitario: number
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: string
          ordem?: number
          os_id?: string
          quantidade?: number
          subtotal?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_servicos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_servicos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_paga: string | null
          data_prevista: string | null
          id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          observacoes: string | null
          ordem: number
          os_id: string
          status: Database["public"]["Enums"]["pagamento_status"]
          valor: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_paga?: string | null
          data_prevista?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          observacoes?: string | null
          ordem?: number
          os_id: string
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_paga?: string | null
          data_prevista?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["pagamento_metodo"]
          observacoes?: string | null
          ordem?: number
          os_id?: string
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      pedido_fornecedor_itens: {
        Row: {
          criado_em: string
          custo_unitario: number
          descricao: string
          id: string
          item_estoque_id: string | null
          os_peca_id: string | null
          pedido_id: string
          quantidade: number
          subtotal: number | null
        }
        Insert: {
          criado_em?: string
          custo_unitario: number
          descricao: string
          id?: string
          item_estoque_id?: string | null
          os_peca_id?: string | null
          pedido_id: string
          quantidade?: number
          subtotal?: number | null
        }
        Update: {
          criado_em?: string
          custo_unitario?: number
          descricao?: string
          id?: string
          item_estoque_id?: string | null
          os_peca_id?: string | null
          pedido_id?: string
          quantidade?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_fornecedor_itens_item_estoque_id_fkey"
            columns: ["item_estoque_id"]
            isOneToOne: false
            referencedRelation: "itens_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_fornecedor_itens_item_estoque_id_fkey"
            columns: ["item_estoque_id"]
            isOneToOne: false
            referencedRelation: "view_itens_abaixo_minimo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_fornecedor_itens_os_peca_id_fkey"
            columns: ["os_peca_id"]
            isOneToOne: false
            referencedRelation: "os_pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_fornecedor_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_fornecedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_fornecedor_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["pedido_id"]
          },
        ]
      }
      pedidos_fornecedor: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_compra: string | null
          data_recebimento: string | null
          fornecedor_id: string
          id: string
          numero: number
          observacoes: string | null
          os_id: string | null
          status: Database["public"]["Enums"]["pedido_fornecedor_status"]
          valor_total: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_compra?: string | null
          data_recebimento?: string | null
          fornecedor_id: string
          id?: string
          numero?: number
          observacoes?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["pedido_fornecedor_status"]
          valor_total?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_compra?: string | null
          data_recebimento?: string | null
          fornecedor_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["pedido_fornecedor_status"]
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_fornecedor_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_fornecedor_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "view_capital_investido"
            referencedColumns: ["os_id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          atualizado_em: string
          cliente_id: string
          cor: string | null
          criado_em: string
          deletado_em: string | null
          id: string
          km_atual: number | null
          modelo_custom: string | null
          modelo_id: string | null
          motor: string | null
          observacoes: string | null
          placa: string | null
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string
          cliente_id: string
          cor?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          km_atual?: number | null
          modelo_custom?: string | null
          modelo_id?: string | null
          motor?: string | null
          observacoes?: string | null
          placa?: string | null
        }
        Update: {
          ano?: number | null
          atualizado_em?: string
          cliente_id?: string
          cor?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          km_atual?: number | null
          modelo_custom?: string | null
          modelo_id?: string | null
          motor?: string | null
          observacoes?: string | null
          placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "view_contas_a_receber"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "veiculos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "vw_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_modelos: {
        Row: {
          ano_fim: number | null
          ano_inicio: number | null
          combustivel: string
          criado_em: string
          id: string
          modelo: string
          motor: string
        }
        Insert: {
          ano_fim?: number | null
          ano_inicio?: number | null
          combustivel?: string
          criado_em?: string
          id?: string
          modelo: string
          motor: string
        }
        Update: {
          ano_fim?: number | null
          ano_inicio?: number | null
          combustivel?: string
          criado_em?: string
          id?: string
          modelo?: string
          motor?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_capital_investido: {
        Row: {
          cliente_nome: string | null
          cliente_pagou: number | null
          data_compra: string | null
          fornecedor_nome: string | null
          numero: number | null
          os_id: string | null
          os_numero: number | null
          os_total: number | null
          pedido_id: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      view_contas_a_receber: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          parcelas_atrasadas: number | null
          parcelas_em_aberto: number | null
          proxima_data: string | null
          telefone: string | null
          total_atrasado: number | null
          total_em_aberto: number | null
        }
        Relationships: []
      }
      view_itens_abaixo_minimo: {
        Row: {
          alerta_minimo: number | null
          ativo: boolean | null
          atualizado_em: string | null
          categoria_id: string | null
          criado_em: string | null
          custo_medio: number | null
          deletado_em: string | null
          descricao: string | null
          id: string | null
          observacoes: string | null
          preco_venda: number | null
          quantidade_atual: number | null
          sku: string | null
          unidade: string | null
        }
        Insert: {
          alerta_minimo?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          criado_em?: string | null
          custo_medio?: number | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string | null
          observacoes?: string | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          sku?: string | null
          unidade?: string | null
        }
        Update: {
          alerta_minimo?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          criado_em?: string | null
          custo_medio?: number | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string | null
          observacoes?: string | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          sku?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_estoque_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aplicar_movimentacao_estoque: {
        Args: {
          p_ajuste_motivo?: string
          p_custo_unitario?: number
          p_item_id: string
          p_os_id?: string
          p_os_peca_id?: string
          p_pedido_fornecedor_id?: string
          p_pedido_loja_id?: string
          p_quantidade: number
          p_tipo: Database["public"]["Enums"]["movimentacao_tipo"]
        }
        Returns: string
      }
      marca_pagamentos_atrasados: { Args: never; Returns: number }
      recalcula_totais_os: { Args: { p_os_id: string }; Returns: undefined }
      recalcula_total_pedido_fornecedor: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
    }
    Enums: {
      foto_momento: "entrada" | "saida" | "durante"
      link_afiliado_status:
        | "enviado"
        | "cliente_comprou"
        | "comissao_recebida"
        | "cancelado"
      movimentacao_tipo: "entrada" | "saida_os" | "saida_loja" | "ajuste"
      os_status:
        | "aberta"
        | "em_andamento"
        | "aguardando_peca"
        | "pronta"
        | "entregue"
        | "cancelada"
      pagamento_metodo: "pix" | "dinheiro" | "cartao" | "transferencia"
      pagamento_status: "pendente" | "pago" | "atrasado" | "cancelado"
      peca_origem: "estoque" | "fornecedor" | "mercado_livre_afiliado"
      peca_status: "pendente" | "comprada" | "recebida" | "aplicada"
      pedido_fornecedor_status:
        | "cotacao"
        | "comprado"
        | "recebido"
        | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      foto_momento: ["entrada", "saida", "durante"],
      link_afiliado_status: [
        "enviado",
        "cliente_comprou",
        "comissao_recebida",
        "cancelado",
      ],
      movimentacao_tipo: ["entrada", "saida_os", "saida_loja", "ajuste"],
      os_status: [
        "aberta",
        "em_andamento",
        "aguardando_peca",
        "pronta",
        "entregue",
        "cancelada",
      ],
      pagamento_metodo: ["pix", "dinheiro", "cartao", "transferencia"],
      pagamento_status: ["pendente", "pago", "atrasado", "cancelado"],
      peca_origem: ["estoque", "fornecedor", "mercado_livre_afiliado"],
      peca_status: ["pendente", "comprada", "recebida", "aplicada"],
      pedido_fornecedor_status: [
        "cotacao",
        "comprado",
        "recebido",
        "cancelado",
      ],
    },
  },
} as const
