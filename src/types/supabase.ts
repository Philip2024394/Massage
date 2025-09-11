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
      places: {
        Row: {
          account_number: string
          address: string | null
          city: string | null
          created_at: string
          gallery_image_urls: string[] | null
          id: string
          languages: string[] | null
          lat: number | null
          lng: number | null
          login_code: string
          name: string | null
          opening_hours: Json | null
          phone: string | null
          pricing_session_120: number | null
          pricing_session_60: number | null
          pricing_session_90: number | null
          profile_image_url: string | null
          rating: number
          review_count: number
          services: string[] | null
          status: Database["public"]["Enums"]["place_status"]
        }
        Insert: {
          account_number: string
          address?: string | null
          city?: string | null
          created_at?: string
          gallery_image_urls?: string[] | null
          id?: string
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          login_code: string
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          pricing_session_120?: number | null
          pricing_session_60?: number | null
          pricing_session_90?: number | null
          profile_image_url?: string | null
          rating?: number
          review_count?: number
          services?: string[] | null
          status?: Database["public"]["Enums"]["place_status"]
        }
        Update: {
          account_number?: string
          address?: string | null
          city?: string | null
          created_at?: string
          gallery_image_urls?: string[] | null
          id?: string
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          login_code?: string
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          pricing_session_120?: number | null
          pricing_session_60?: number | null
          pricing_session_90?: number | null
          profile_image_url?: string | null
          rating?: number
          review_count?: number
          services?: string[] | null
          status?: Database["public"]["Enums"]["place_status"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          customer_whatsapp: string
          id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["user_account_type"]
        }
        Insert: {
          comment: string
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          id?: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["user_account_type"]
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["user_account_type"]
        }
        Relationships: []
      }
      therapists: {
        Row: {
          account_number: string
          address: string | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          created_at: string
          experience: number | null
          id: string
          is_online: boolean
          languages: string[] | null
          lat: number | null
          lng: number | null
          login_code: string
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
          status: Database["public"]["Enums"]["therapist_status"]
        }
        Insert: {
          account_number: string
          address?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string
          experience?: number | null
          id?: string
          is_online?: boolean
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          login_code: string
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
          status?: Database["public"]["Enums"]["therapist_status"]
        }
        Update: {
          account_number?: string
          address?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string
          experience?: number | null
          id?: string
          is_online?: boolean
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          login_code?: string
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
          status?: Database["public"]["Enums"]["therapist_status"]
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
      place_status: "pending" | "active" | "blocked"
      review_status: "pending" | "approved" | "rejected"
      therapist_status: "pending" | "active" | "blocked"
      user_account_type: "therapist" | "place"
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
