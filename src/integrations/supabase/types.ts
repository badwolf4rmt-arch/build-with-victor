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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      folders: {
        Row: {
          id: string
          name: string
          position: number
          quiz_ids: string[]
        }
        Insert: {
          id: string
          name: string
          position?: number
          quiz_ids?: string[]
        }
        Update: {
          id?: string
          name?: string
          position?: number
          quiz_ids?: string[]
        }
        Relationships: []
      }
      live_answers: {
        Row: {
          answer: string
          correct: boolean
          created_at: string
          id: string
          player_id: string
          points: number
          question: number
          session_code: string
        }
        Insert: {
          answer: string
          correct: boolean
          created_at?: string
          id?: string
          player_id: string
          points?: number
          question: number
          session_code: string
        }
        Update: {
          answer?: string
          correct?: boolean
          created_at?: string
          id?: string
          player_id?: string
          points?: number
          question?: number
          session_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "live_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_answers_session_code_fkey"
            columns: ["session_code"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["code"]
          },
        ]
      }
      live_players: {
        Row: {
          id: string
          joined_at: string
          name: string
          score: number
          session_code: string
          team: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          name: string
          score?: number
          session_code: string
          team?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          name?: string
          score?: number
          session_code?: string
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_players_session_code_fkey"
            columns: ["session_code"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["code"]
          },
        ]
      }
      live_sessions: {
        Row: {
          auto_reveal: boolean
          code: string
          created_at: string
          current: number
          items: Json
          mode: string
          question_started_at: number | null
          quiz_id: string
          speed_scoring: boolean
          state: string
          teams: Json
          title: string
        }
        Insert: {
          auto_reveal?: boolean
          code: string
          created_at?: string
          current?: number
          items?: Json
          mode?: string
          question_started_at?: number | null
          quiz_id: string
          speed_scoring?: boolean
          state?: string
          teams?: Json
          title?: string
        }
        Update: {
          auto_reveal?: boolean
          code?: string
          created_at?: string
          current?: number
          items?: Json
          mode?: string
          question_started_at?: number | null
          quiz_id?: string
          speed_scoring?: boolean
          state?: string
          teams?: Json
          title?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          cover_url: string | null
          created_at: number
          deleted: boolean
          grade: string | null
          id: string
          items: Json
          mine: boolean
          subject: string | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: number
          deleted?: boolean
          grade?: string | null
          id: string
          items?: Json
          mine?: boolean
          subject?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: number
          deleted?: boolean
          grade?: string | null
          id?: string
          items?: Json
          mine?: boolean
          subject?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
