export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          customer_whatsapp: string
          id: string
          rating: number
          status: "pending" | "approved" | "rejected"
          therapist_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          id?: string
          rating: number
          status?: "pending" | "approved" | "rejected"
          therapist_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          id?: string
          rating?: number
          status?: "pending" | "approved" | "rejected"
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapists: {
        Row: {
          bio: string | null
          certifications: string[] | null
          city: string | null
          email: string | null
          experience: number | null
          id: string
          is_online: boolean
          languages: string[] | null
          lat: number | null
          lng: number | null
          massage_types: string[] | null
          name: string | null
          phone: string | null
          pricing_session_120: number | null
          pricing_session_60: number | null
          pricing_session_90: number | null
          profile_image_url: string | null
          rating: number
          review_count: number
          specialties: string[] | null
          status: "pending" | "active" | "blocked"
          therapist_number: string | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          email?: string | null
          experience?: number | null
          id: string
          is_online?: boolean
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          massage_types?: string[] | null
          name?: string | null
          phone?: string | null
          pricing_session_120?: number | null
          pricing_session_60?: number | null
          pricing_session_90?: number | null
          profile_image_url?: string | null
          rating?: number
          review_count?: number
          specialties?: string[] | null
          status?: "pending" | "active" | "blocked"
          therapist_number?: string | null
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          email?: string | null
          experience?: number | null
          id?: string
          is_online?: boolean
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          massage_types?: string[] | null
          name?: string | null
          phone?: string | null
          pricing_session_120?: number | null
          pricing_session_60?: number | null
          pricing_session_90?: number | null
          profile_image_url?: string | null
          rating?: number
          review_count?: number
          specialties?: string[] | null
          status?: "pending" | "active" | "blocked"
          therapist_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapists_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: Record<PropertyKey, never>
      }
    }
    Enums: {
      review_status: "pending" | "approved" | "rejected"
      therapist_status: "pending" | "active" | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
