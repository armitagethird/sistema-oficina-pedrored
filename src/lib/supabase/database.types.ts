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
        ]
      }
      os_pecas: {
        Row: {
          criado_em: string
          custo_unitario: number
          descricao: string
          fornecedor_nome: string | null
          id: string
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
            foreignKeyName: "os_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      recalcula_totais_os: { Args: { p_os_id: string }; Returns: undefined }
    }
    Enums: {
      foto_momento: "entrada" | "saida" | "durante"
      os_status:
        | "aberta"
        | "em_andamento"
        | "aguardando_peca"
        | "pronta"
        | "entregue"
        | "cancelada"
      peca_origem: "estoque" | "fornecedor" | "mercado_livre_afiliado"
      peca_status: "pendente" | "comprada" | "recebida" | "aplicada"
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
      os_status: [
        "aberta",
        "em_andamento",
        "aguardando_peca",
        "pronta",
        "entregue",
        "cancelada",
      ],
      peca_origem: ["estoque", "fornecedor", "mercado_livre_afiliado"],
      peca_status: ["pendente", "comprada", "recebida", "aplicada"],
    },
  },
} as const
