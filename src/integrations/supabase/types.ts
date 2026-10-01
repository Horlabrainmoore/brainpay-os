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
      exchange_settings: {
        Row: {
          base_url: string
          last_test_at: string | null
          last_test_ok: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_url: string
          last_test_at?: string | null
          last_test_ok?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_url?: string
          last_test_at?: string | null
          last_test_ok?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metacopier_proxy_logs: {
        Row: {
          correlation_id: string
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          method: string
          ok: boolean
          path: string
          status: number | null
          user_id: string | null
        }
        Insert: {
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          method: string
          ok?: boolean
          path: string
          status?: number | null
          user_id?: string | null
        }
        Update: {
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          method?: string
          ok?: boolean
          path?: string
          status?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      moonpay_events: {
        Row: {
          amount: number | null
          base_amount: number | null
          base_currency_code: string | null
          created_at: string
          currency_code: string | null
          event_type: string
          id: string
          raw: Json | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          base_amount?: number | null
          base_currency_code?: string | null
          created_at?: string
          currency_code?: string | null
          event_type: string
          id?: string
          raw?: Json | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          base_amount?: number | null
          base_currency_code?: string | null
          created_at?: string
          currency_code?: string | null
          event_type?: string
          id?: string
          raw?: Json | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moonpay_settings: {
        Row: {
          api_key: string | null
          created_at: string
          currency_code: string | null
          default_currency_code: string | null
          environment: string
          show_only_currencies: string | null
          skip_unsupported_region_screen: boolean
          unsupported_region_redirect_url: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          currency_code?: string | null
          default_currency_code?: string | null
          environment?: string
          show_only_currencies?: string | null
          skip_unsupported_region_screen?: boolean
          unsupported_region_redirect_url?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          currency_code?: string | null
          default_currency_code?: string | null
          environment?: string
          show_only_currencies?: string | null
          skip_unsupported_region_screen?: boolean
          unsupported_region_redirect_url?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          email_alerts: boolean
          notify_payment: boolean
          notify_trade: boolean
          notify_wallet_tx: boolean
          payment_updates: boolean
          push_alerts: boolean
          security_alerts: boolean
          trade_signals: boolean
          updated_at: string
          user_id: string
          webhook_secret: string | null
          webhook_url: string | null
          weekly_summary: boolean
        }
        Insert: {
          email_alerts?: boolean
          notify_payment?: boolean
          notify_trade?: boolean
          notify_wallet_tx?: boolean
          payment_updates?: boolean
          push_alerts?: boolean
          security_alerts?: boolean
          trade_signals?: boolean
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
          webhook_url?: string | null
          weekly_summary?: boolean
        }
        Update: {
          email_alerts?: boolean
          notify_payment?: boolean
          notify_trade?: boolean
          notify_wallet_tx?: boolean
          payment_updates?: boolean
          push_alerts?: boolean
          security_alerts?: boolean
          trade_signals?: boolean
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string | null
          weekly_summary?: boolean
        }
        Relationships: []
      }
      oauth_client_consents: {
        Row: {
          approved: boolean
          client_id: string | null
          client_name: string | null
          created_at: string
          id: string
          redirect_uri: string | null
          scopes: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          redirect_uri?: string | null
          scopes?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          redirect_uri?: string | null
          scopes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_currency: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferred_currency?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_currency?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          confidence: number | null
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          pnl: number
          side: string
          signal_id: string | null
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          amount: number
          confidence?: number | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          pnl?: number
          side: string
          signal_id?: string | null
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          amount?: number
          confidence?: number | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl?: number
          side?: string
          signal_id?: string | null
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          asset: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          status: string
          type: string
          usd_value: number
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: string
          type: string
          usd_value?: number
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: string
          type?: string
          usd_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          encrypted_secret: string | null
          id: string
          iv: string
          label: string
          last_used_at: string | null
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          encrypted_secret?: string | null
          id?: string
          iv: string
          label: string
          last_used_at?: string | null
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          encrypted_secret?: string | null
          id?: string
          iv?: string
          label?: string
          last_used_at?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          event_type: string
          http_status: number | null
          id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          payload: Json
          response_summary: string | null
          status: string
          url: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          event_type: string
          http_status?: number | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          payload?: Json
          response_summary?: string | null
          status?: string
          url: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          event_type?: string
          http_status?: number | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          payload?: Json
          response_summary?: string | null
          status?: string
          url?: string
          user_id?: string
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
