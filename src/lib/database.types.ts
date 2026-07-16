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
      call_logs: {
        Row: {
          call_provider: string | null
          call_sid: string | null
          case_id: string
          created_at: string
          extracted_data: Json | null
          id: string
          outcome: string | null
          transcript: string | null
        }
        Insert: {
          call_provider?: string | null
          call_sid?: string | null
          case_id: string
          created_at?: string
          extracted_data?: Json | null
          id?: string
          outcome?: string | null
          transcript?: string | null
        }
        Update: {
          call_provider?: string | null
          call_sid?: string | null
          case_id?: string
          created_at?: string
          extracted_data?: Json | null
          id?: string
          outcome?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "verification_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          attempt_number: number | null
          call_sid: string | null
          created_at: string | null
          duration: number | null
          employer_response: string | null
          id: string
          recording_url: string | null
          status: string | null
          transcription: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_number?: number | null
          call_sid?: string | null
          created_at?: string | null
          duration?: number | null
          employer_response?: string | null
          id?: string
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_number?: number | null
          call_sid?: string | null
          created_at?: string | null
          duration?: number | null
          employer_response?: string | null
          id?: string
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employers: {
        Row: {
          created_at: string
          hr_contact_email: string | null
          hr_contact_name: string | null
          hr_contact_phone: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          job_id: string | null
          job_type: string | null
          payload: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          job_type?: string | null
          payload?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          job_type?: string | null
          payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_cases: {
        Row: {
          bolna_agent_id: string | null
          bolna_execution_id: string | null
          candidate_id: string
          check_type: string | null
          client_id: string
          created_at: string
          employer_id: string | null
          id: string
          retry_count: number
          status: Database["public"]["Enums"]["verification_status"]
          tabbly_agent_id: string | null
          tabbly_campaign_id: string | null
          updated_at: string
        }
        Insert: {
          bolna_agent_id?: string | null
          bolna_execution_id?: string | null
          candidate_id: string
          check_type?: string | null
          client_id: string
          created_at?: string
          employer_id?: string | null
          id?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["verification_status"]
          tabbly_agent_id?: string | null
          tabbly_campaign_id?: string | null
          updated_at?: string
        }
        Update: {
          bolna_agent_id?: string | null
          bolna_execution_id?: string | null
          candidate_id?: string
          check_type?: string | null
          client_id?: string
          created_at?: string
          employer_id?: string | null
          id?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["verification_status"]
          tabbly_agent_id?: string | null
          tabbly_campaign_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_cases_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_cases_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      verification_status:
        | "pending"
        | "dialing"
        | "in_progress"
        | "needs_retry"
        | "escalated"
        | "verified"
        | "failed"
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
  public: {
    Enums: {
      verification_status: [
        "pending",
        "dialing",
        "in_progress",
        "needs_retry",
        "escalated",
        "verified",
        "failed",
      ],
    },
  },
} as const
