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
      achievements: {
        Row: {
          code: string
          description: string | null
          earned_at: string
          emoji: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string | null
          earned_at?: string
          emoji?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string | null
          earned_at?: string
          emoji?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      candy_passages: {
        Row: {
          body: Json
          category: string
          created_at: string
          emoji: string | null
          english_hint: string | null
          generated_by: string | null
          id: string
          level: Database["public"]["Enums"]["learning_level"]
          reading_minutes: number | null
          slug: string | null
          title: string
          topic: string
        }
        Insert: {
          body: Json
          category: string
          created_at?: string
          emoji?: string | null
          english_hint?: string | null
          generated_by?: string | null
          id?: string
          level: Database["public"]["Enums"]["learning_level"]
          reading_minutes?: number | null
          slug?: string | null
          title: string
          topic: string
        }
        Update: {
          body?: Json
          category?: string
          created_at?: string
          emoji?: string | null
          english_hint?: string | null
          generated_by?: string | null
          id?: string
          level?: Database["public"]["Enums"]["learning_level"]
          reading_minutes?: number | null
          slug?: string | null
          title?: string
          topic?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          level: Database["public"]["Enums"]["learning_level"]
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          level: Database["public"]["Enums"]["learning_level"]
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          level?: Database["public"]["Enums"]["learning_level"]
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          created_at: string
          day: string
          id: string
          lessons_done: number
          minutes: number
          user_id: string
          words_saved: number
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          lessons_done?: number
          minutes?: number
          user_id: string
          words_saved?: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          lessons_done?: number
          minutes?: number
          user_id?: string
          words_saved?: number
        }
        Relationships: []
      }
      grammar_patterns: {
        Row: {
          created_at: string
          examples: Json
          id: string
          level: string
          meaning: string
          pattern: string
          structure: string | null
          tags: string[]
        }
        Insert: {
          created_at?: string
          examples?: Json
          id?: string
          level?: string
          meaning: string
          pattern: string
          structure?: string | null
          tags?: string[]
        }
        Update: {
          created_at?: string
          examples?: Json
          id?: string
          level?: string
          meaning?: string
          pattern?: string
          structure?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      hanja: {
        Row: {
          character: string
          created_at: string
          examples: Json
          id: string
          korean_reading: string
          meaning: string
          notes: string | null
          romanization: string | null
        }
        Insert: {
          character: string
          created_at?: string
          examples?: Json
          id?: string
          korean_reading: string
          meaning: string
          notes?: string | null
          romanization?: string | null
        }
        Update: {
          character?: string
          created_at?: string
          examples?: Json
          id?: string
          korean_reading?: string
          meaning?: string
          notes?: string | null
          romanization?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          grammar_focus: string | null
          id: string
          passage_id: string | null
          sort_order: number
          summary: string | null
          title: string
          vocab_count: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          grammar_focus?: string | null
          id?: string
          passage_id?: string | null
          sort_order?: number
          summary?: string | null
          title: string
          vocab_count?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          grammar_focus?: string | null
          id?: string
          passage_id?: string | null
          sort_order?: number
          summary?: string | null
          title?: string
          vocab_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "candy_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          passage_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          passage_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          passage_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "candy_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_goal_min: number
          display_name: string | null
          id: string
          last_active_date: string | null
          level: Database["public"]["Enums"]["learning_level"]
          onboarded: boolean
          streak_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_goal_min?: number
          display_name?: string | null
          id: string
          last_active_date?: string | null
          level?: Database["public"]["Enums"]["learning_level"]
          onboarded?: boolean
          streak_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_goal_min?: number
          display_name?: string | null
          id?: string
          last_active_date?: string | null
          level?: Database["public"]["Enums"]["learning_level"]
          onboarded?: boolean
          streak_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          score: number
          suggested_level: Database["public"]["Enums"]["learning_level"]
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          score: number
          suggested_level: Database["public"]["Enums"]["learning_level"]
          total: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          score?: number
          suggested_level?: Database["public"]["Enums"]["learning_level"]
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          minutes_spent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          minutes_spent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          minutes_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      vocab_saved: {
        Row: {
          created_at: string
          grammar: string | null
          id: string
          korean: string
          meaning: string
          note: string | null
          pos: string | null
          romanization: string | null
          source_passage_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          grammar?: string | null
          id?: string
          korean: string
          meaning: string
          note?: string | null
          pos?: string | null
          romanization?: string | null
          source_passage_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          grammar?: string | null
          id?: string
          korean?: string
          meaning?: string
          note?: string | null
          pos?: string | null
          romanization?: string | null
          source_passage_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_saved_source_passage_id_fkey"
            columns: ["source_passage_id"]
            isOneToOne: false
            referencedRelation: "candy_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          created_at: string
          example_en: string | null
          example_kr: string | null
          id: string
          korean: string
          level: string
          meaning: string
          pos: string | null
          romanization: string | null
          tags: string[]
          topic: string | null
        }
        Insert: {
          created_at?: string
          example_en?: string | null
          example_kr?: string | null
          id?: string
          korean: string
          level?: string
          meaning: string
          pos?: string | null
          romanization?: string | null
          tags?: string[]
          topic?: string | null
        }
        Update: {
          created_at?: string
          example_en?: string | null
          example_kr?: string | null
          id?: string
          korean?: string
          level?: string
          meaning?: string
          pos?: string | null
          romanization?: string | null
          tags?: string[]
          topic?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      learning_level: "L1" | "L2" | "L3" | "L4" | "L5"
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
      app_role: ["admin", "moderator", "user"],
      learning_level: ["L1", "L2", "L3", "L4", "L5"],
    },
  },
} as const
