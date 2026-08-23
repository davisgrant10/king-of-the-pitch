// Generated from the live Supabase project — regenerate after schema changes:
//   npx supabase gen types typescript --project-id ellofwzolvfrrosedxkh > src/lib/supabase/database.types.ts
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
      match_rosters: {
        Row: {
          match_id: string
          player_id: string
          side: string
        }
        Insert: {
          match_id: string
          player_id: string
          side: string
        }
        Update: {
          match_id?: string
          player_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_rosters_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_rosters_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_lines"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_standings"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          id: string
          kind: string
          night_date: string
          pitch_no: number
          played_at: string | null
          result: string | null
          round_no: number
          score_a: number
          score_b: number
          season_id: string
          via_shootout: boolean
        }
        Insert: {
          id?: string
          kind?: string
          night_date: string
          pitch_no?: number
          played_at?: string | null
          result?: string | null
          round_no: number
          score_a?: number
          score_b?: number
          season_id: string
          via_shootout?: boolean
        }
        Update: {
          id?: string
          kind?: string
          night_date?: string
          pitch_no?: number
          played_at?: string | null
          result?: string | null
          round_no?: number
          score_a?: number
          score_b?: number
          season_id?: string
          via_shootout?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club: string | null
          created_at: string
          id: string
          name: string
          skill: number | null
        }
        Insert: {
          club?: string | null
          created_at?: string
          id?: string
          name: string
          skill?: number | null
        }
        Update: {
          club?: string | null
          created_at?: string
          id?: string
          name?: string
          skill?: number | null
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          night_date: string
          player_id: string
          season_id: string
          status: string
          updated_at: string
        }
        Insert: {
          night_date: string
          player_id: string
          season_id: string
          status: string
          updated_at?: string
        }
        Update: {
          night_date?: string
          player_id?: string
          season_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_standings"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "rsvps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_store: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      season_players: {
        Row: {
          player_id: string
          season_id: string
        }
        Insert: {
          player_id: string
          season_id: string
        }
        Update: {
          player_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_standings"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_players_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          best_n: number | null
          created_at: string
          crown_multiplier: number
          draw_pts: number
          ends_on: string | null
          id: string
          name: string
          starts_on: string | null
          win_pts: number
        }
        Insert: {
          best_n?: number | null
          created_at?: string
          crown_multiplier?: number
          draw_pts?: number
          ends_on?: string | null
          id?: string
          name: string
          starts_on?: string | null
          win_pts?: number
        }
        Update: {
          best_n?: number | null
          created_at?: string
          crown_multiplier?: number
          draw_pts?: number
          ends_on?: string | null
          id?: string
          name?: string
          starts_on?: string | null
          win_pts?: number
        }
        Relationships: []
      }
    }
    Views: {
      player_match_lines: {
        Row: {
          ga: number | null
          gf: number | null
          kind: string | null
          match_id: string | null
          night_date: string | null
          outcome: string | null
          player_id: string | null
          pts: number | null
          season_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_standings"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      player_night_points: {
        Row: {
          night_date: string | null
          night_pts: number | null
          player_id: string | null
          season_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_standings"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      player_standings: {
        Row: {
          all_pts: number | null
          club: string | null
          d: number | null
          ga: number | null
          gd: number | null
          gf: number | null
          l: number | null
          mp: number | null
          name: string | null
          player_id: string | null
          pts: number | null
          season_id: string | null
          w: number | null
          win_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_round: {
        Args: { p_fixtures: Json; p_night: string; p_season_id: string }
        Returns: string[]
      }
      save_store: {
        Args: { p_data: Json; p_key: string; p_secret: string }
        Returns: undefined
      }
      submit_result: {
        Args: {
          p_match_id: string
          p_result: string
          p_score_a: number
          p_score_b: number
          p_via_shootout?: boolean
        }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const

// Convenience aliases used across the app
export type Standing = Database["public"]["Views"]["player_standings"]["Row"]
export type Player = Database["public"]["Tables"]["players"]["Row"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Season = Database["public"]["Tables"]["seasons"]["Row"]
