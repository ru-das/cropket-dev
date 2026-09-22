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
      bids: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          lot_id: string | null
          mega_lot_id: string | null
          price_per_quintal_paise: number
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          lot_id?: string | null
          mega_lot_id?: string | null
          price_per_quintal_paise: number
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          lot_id?: string | null
          mega_lot_id?: string | null
          price_per_quintal_paise?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_mega_lot_id_fkey"
            columns: ["mega_lot_id"]
            isOneToOne: false
            referencedRelation: "mega_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_kyc: {
        Row: {
          business_name: string
          buyer_id: string
          created_at: string
          gst_number: string
          pan_last4: string
          source: string
          status: string
          verified_at: string | null
        }
        Insert: {
          business_name: string
          buyer_id: string
          created_at?: string
          gst_number: string
          pan_last4: string
          source: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          business_name?: string
          buyer_id?: string
          created_at?: string
          gst_number?: string
          pan_last4?: string
          source?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_kyc_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_rules: {
        Row: {
          crop: string
          floor_method: string
          has_msp: boolean
          max_hold_days: number
          msp_per_quintal_paise: number | null
          perishability: number
          transit_loss_pct: number
        }
        Insert: {
          crop: string
          floor_method: string
          has_msp?: boolean
          max_hold_days: number
          msp_per_quintal_paise?: number | null
          perishability: number
          transit_loss_pct: number
        }
        Update: {
          crop?: string
          floor_method?: string
          has_msp?: boolean
          max_hold_days?: number
          msp_per_quintal_paise?: number | null
          perishability?: number
          transit_loss_pct?: number
        }
        Relationships: []
      }
      grade_results: {
        Row: {
          client_created_at: string | null
          colour_pct: number | null
          confidence: number | null
          created_at: string
          crop: string
          damage_pct: number | null
          farmer_id: string
          grade: string | null
          id: string
          kind: string
          needs_human_check: boolean
          photo_paths: string[]
          size_label: string | null
          source: string | null
          status: string
        }
        Insert: {
          client_created_at?: string | null
          colour_pct?: number | null
          confidence?: number | null
          created_at?: string
          crop: string
          damage_pct?: number | null
          farmer_id: string
          grade?: string | null
          id: string
          kind?: string
          needs_human_check?: boolean
          photo_paths: string[]
          size_label?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          client_created_at?: string | null
          colour_pct?: number | null
          confidence?: number | null
          created_at?: string
          crop?: string
          damage_pct?: number | null
          farmer_id?: string
          grade?: string | null
          id?: string
          kind?: string
          needs_human_check?: boolean
          photo_paths?: string[]
          size_label?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_results_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          client_created_at: string | null
          created_at: string
          crop: string
          farmer_id: string
          grade: string | null
          grade_result_id: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          qr_code: string
          quantity_kg: number
          status: Database["public"]["Enums"]["lot_status"]
        }
        Insert: {
          client_created_at?: string | null
          created_at?: string
          crop: string
          farmer_id: string
          grade?: string | null
          grade_result_id?: string | null
          id: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          qr_code: string
          quantity_kg: number
          status?: Database["public"]["Enums"]["lot_status"]
        }
        Update: {
          client_created_at?: string | null
          created_at?: string
          crop?: string
          farmer_id?: string
          grade?: string | null
          grade_result_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          qr_code?: string
          quantity_kg?: number
          status?: Database["public"]["Enums"]["lot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lots_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_grade_result_id_fkey"
            columns: ["grade_result_id"]
            isOneToOne: false
            referencedRelation: "grade_results"
            referencedColumns: ["id"]
          },
        ]
      }
      mandi_heat: {
        Row: {
          colour: string
          crop: string
          date: string
          mandi_id: string
          ratio: number
        }
        Insert: {
          colour: string
          crop: string
          date: string
          mandi_id: string
          ratio: number
        }
        Update: {
          colour?: string
          crop?: string
          date?: string
          mandi_id?: string
          ratio?: number
        }
        Relationships: [
          {
            foreignKeyName: "mandi_heat_mandi_id_fkey"
            columns: ["mandi_id"]
            isOneToOne: false
            referencedRelation: "mandis"
            referencedColumns: ["id"]
          },
        ]
      }
      mandi_prices: {
        Row: {
          arrivals_tonnes: number | null
          crop: string
          date: string
          mandi_id: string
          max_price_paise: number
          min_price_paise: number
          modal_price_paise: number
          source: string
        }
        Insert: {
          arrivals_tonnes?: number | null
          crop: string
          date: string
          mandi_id: string
          max_price_paise: number
          min_price_paise: number
          modal_price_paise: number
          source: string
        }
        Update: {
          arrivals_tonnes?: number | null
          crop?: string
          date?: string
          mandi_id?: string
          max_price_paise?: number
          min_price_paise?: number
          modal_price_paise?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandi_prices_mandi_id_fkey"
            columns: ["mandi_id"]
            isOneToOne: false
            referencedRelation: "mandis"
            referencedColumns: ["id"]
          },
        ]
      }
      mandis: {
        Row: {
          agmarknet_market_id: number | null
          agmarknet_name: string | null
          district: string
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          name: string
          state: string
        }
        Insert: {
          agmarknet_market_id?: number | null
          agmarknet_name?: string | null
          district?: string
          id: string
          lat?: number | null
          lng?: number | null
          location: unknown
          name: string
          state?: string
        }
        Update: {
          agmarknet_market_id?: number | null
          agmarknet_name?: string | null
          district?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          name?: string
          state?: string
        }
        Relationships: []
      }
      mega_lot_items: {
        Row: {
          farmer_id: string
          id: string
          lot_id: string
          mega_lot_id: string
          quantity_kg: number
        }
        Insert: {
          farmer_id: string
          id?: string
          lot_id: string
          mega_lot_id: string
          quantity_kg: number
        }
        Update: {
          farmer_id?: string
          id?: string
          lot_id?: string
          mega_lot_id?: string
          quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "mega_lot_items_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_lot_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_lot_items_mega_lot_id_fkey"
            columns: ["mega_lot_id"]
            isOneToOne: false
            referencedRelation: "mega_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_lots: {
        Row: {
          created_at: string
          crop: string
          fpo_id: string | null
          grade: string
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          status: Database["public"]["Enums"]["lot_status"]
          total_kg: number
        }
        Insert: {
          created_at?: string
          crop: string
          fpo_id?: string | null
          grade: string
          id?: string
          lat?: number | null
          lng?: number | null
          location: unknown
          status?: Database["public"]["Enums"]["lot_status"]
          total_kg: number
        }
        Update: {
          created_at?: string
          crop?: string
          fpo_id?: string | null
          grade?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          status?: Database["public"]["Enums"]["lot_status"]
          total_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "mega_lots_fpo_id_fkey"
            columns: ["fpo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banned: boolean
          created_at: string
          crops: string[]
          district: string | null
          id: string
          kyc_status: string
          language: string
          lat: number | null
          lng: number | null
          location: unknown
          name: string | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          strikes: number
          trust_score: number
          village: string | null
        }
        Insert: {
          banned?: boolean
          created_at?: string
          crops?: string[]
          district?: string | null
          id: string
          kyc_status?: string
          language?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          name?: string | null
          phone?: string
          role: Database["public"]["Enums"]["user_role"]
          state?: string | null
          strikes?: number
          trust_score?: number
          village?: string | null
        }
        Update: {
          banned?: boolean
          created_at?: string
          crops?: string[]
          district?: string | null
          id?: string
          kyc_status?: string
          language?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          name?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          strikes?: number
          trust_score?: number
          village?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      route_cache: {
        Row: {
          fetched_at: string
          from_lat: number
          from_lng: number
          km: number
          minutes: number
          to_lat: number
          to_lng: number
        }
        Insert: {
          fetched_at?: string
          from_lat: number
          from_lng: number
          km: number
          minutes: number
          to_lat: number
          to_lng: number
        }
        Update: {
          fetched_at?: string
          from_lat?: number
          from_lng?: number
          km?: number
          minutes?: number
          to_lat?: number
          to_lng?: number
        }
        Relationships: []
      }
      transporters: {
        Row: {
          id: string
          name: string
          phone: string
          rate_per_km_paise: number
        }
        Insert: {
          id: string
          name: string
          phone: string
          rate_per_km_paise: number
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          rate_per_km_paise?: number
        }
        Relationships: []
      }
      weather_daily: {
        Row: {
          date: string
          district: string
          fetched_at: string
          rain_mm: number
          temp_max: number | null
        }
        Insert: {
          date: string
          district: string
          fetched_at?: string
          rain_mm: number
          temp_max?: number | null
        }
        Update: {
          date?: string
          district?: string
          fetched_at?: string
          rain_mm?: number
          temp_max?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mandi_heat_inputs: {
        Args: { p_date: string }
        Returns: {
          arrivals_tonnes: number
          avg_arrivals_30d: number
          crop: string
          mandi_id: string
          nearby_lot_tonnes: number
        }[]
      }
      place_bid: {
        Args: {
          p_price_per_quintal_paise: number
          p_target_id: string
          p_target_type: string
        }
        Returns: {
          below_floor: boolean
          bid_id: string
          is_highest: boolean
        }[]
      }
      trigger_cron_fetch_prices: { Args: never; Returns: number }
    }
    Enums: {
      lot_status:
        | "draft"
        | "listed"
        | "in_mega"
        | "sold"
        | "in_transit"
        | "delivered"
        | "rescued"
        | "salvage"
      user_role: "farmer" | "buyer" | "fpo" | "admin" | "nbfc"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      lot_status: [
        "draft",
        "listed",
        "in_mega",
        "sold",
        "in_transit",
        "delivered",
        "rescued",
        "salvage",
      ],
      user_role: ["farmer", "buyer", "fpo", "admin", "nbfc"],
    },
  },
} as const
