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
  public: {
    Tables: {
      availability_slots: {
        Row: {
          booked: boolean
          created_at: string
          duration_min: number
          id: string
          modality: string
          session_id: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          booked?: boolean
          created_at?: string
          duration_min?: number
          id?: string
          modality?: string
          session_id?: string | null
          starts_at: string
          user_id?: string
        }
        Update: {
          booked?: boolean
          created_at?: string
          duration_min?: number
          id?: string
          modality?: string
          session_id?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_tokens: {
        Row: {
          created_at: string
          id: string
          label: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          token_hash: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_audit: {
        Row: {
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string
          id: string
          operation: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          id?: string
          operation: string
          transaction_id: string
          user_id: string
        }
        Update: {
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          id?: string
          operation?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_records: {
        Row: {
          approved: boolean
          clinical_sections: Json
          content: string
          created_at: string
          id: string
          patient_id: string
          sequence_no: number | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          clinical_sections?: Json
          content: string
          created_at?: string
          id?: string
          patient_id: string
          sequence_no?: number | null
          user_id?: string
        }
        Update: {
          approved?: boolean
          clinical_sections?: Json
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          sequence_no?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          approach: string | null
          billing_mode: string
          birth_date: string | null
          cpf: string | null
          created_at: string
          due_day: number
          email: string | null
          id: string
          modality: string
          name: string
          notes: string | null
          payer_cpf: string | null
          phone: string | null
          receipt_opt_in: boolean
          session_price: number
          status: string
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approach?: string | null
          billing_mode?: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          due_day?: number
          email?: string | null
          id?: string
          modality?: string
          name: string
          notes?: string | null
          payer_cpf?: string | null
          phone?: string | null
          receipt_opt_in?: boolean
          session_price?: number
          status?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          approach?: string | null
          billing_mode?: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          due_day?: number
          email?: string | null
          id?: string
          modality?: string
          name?: string
          notes?: string | null
          payer_cpf?: string | null
          phone?: string | null
          receipt_opt_in?: boolean
          session_price?: number
          status?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approach_templates: Json
          avatar_url: string | null
          city: string | null
          created_at: string
          crp: string | null
          default_session_price: number
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          professional_cpf: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          approach_templates?: Json
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          crp?: string | null
          default_session_price?: number
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          professional_cpf?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          approach_templates?: Json
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          crp?: string | null
          default_session_price?: number
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          professional_cpf?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      psychological_documents: {
        Row: {
          content: string
          created_at: string
          finalized_at: string | null
          id: string
          kind: string
          patient_id: string
          source_id: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          finalized_at?: string | null
          id?: string
          kind?: string
          patient_id: string
          source_id?: string | null
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          finalized_at?: string | null
          id?: string
          kind?: string
          patient_id?: string
          source_id?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychological_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "psychological_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      session_recordings: {
        Row: {
          audio_path: string
          created_at: string
          id: string
          kind: string
          media_path: string | null
          report: Json | null
          session_id: string
          status: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_path: string
          created_at?: string
          id?: string
          kind?: string
          media_path?: string | null
          report?: Json | null
          session_id: string
          status?: string
          transcript?: string | null
          user_id?: string
        }
        Update: {
          audio_path?: string
          created_at?: string
          id?: string
          kind?: string
          media_path?: string | null
          report?: Json | null
          session_id?: string
          status?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          modality: string
          patient_id: string
          price: number
          room_code: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          modality?: string
          patient_id: string
          price?: number
          room_code?: string
          starts_at: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          modality?: string
          patient_id?: string
          price?: number
          room_code?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          used_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          used_by?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          id: string
          plan: string
          price: number
          started_at: string
          status: string
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          id?: string
          plan: string
          price?: number
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          user_id?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          id?: string
          plan?: string
          price?: number
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_links: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          patient_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          patient_id: string
          used_at?: string | null
          user_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          patient_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          paid_at: string | null
          patient_id: string | null
          receipt_issued: boolean
          session_id: string | null
          status: string
          type: string
          user_id: string
          version: number
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          due_date?: string
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          receipt_issued?: boolean
          session_id?: string | null
          status?: string
          type?: string
          user_id?: string
          version?: number
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          receipt_issued?: boolean
          session_id?: string | null
          status?: string
          type?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: {
          _email: string
          _name: string
          _phone: string
          _slot_id: string
        }
        Returns: string
      }
      bot_operation: {
        Args: {
          _action: string
          _amount?: number
          _chat?: string
          _code?: string
          _content?: string
          _count?: number
          _owner: string
          _patient?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_available_slots: {
        Args: { _user_id: string }
        Returns: {
          duration_min: number
          id: string
          modality: string
          starts_at: string
        }[]
      }
      public_professional: {
        Args: { _user_id: string }
        Returns: {
          crp: string
          full_name: string
          specialty: string
        }[]
      }
      settle_transactions: {
        Args: { _ids: string[]; _paid: boolean }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
