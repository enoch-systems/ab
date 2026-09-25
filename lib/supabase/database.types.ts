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
      activities: {
        Row: {
          action: string
          actor: string
          created_at: string
          customer_id: string | null
          details: string | null
          id: string
          reference_id: string | null
          shipment_id: string | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          action?: string
          actor?: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          reference_id?: string | null
          shipment_id?: string | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          reference_id?: string | null
          shipment_id?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          message: string
          read: boolean
          shipment_id: string | null
          title: string
          tracking_number: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          message?: string
          read?: boolean
          shipment_id?: string | null
          title?: string
          tracking_number?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          message?: string
          read?: boolean
          shipment_id?: string | null
          title?: string
          tracking_number?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          address: string
          city: string
          company: string | null
          country: string
          created_at: string
          default_instructions: string | null
          default_package_type:
            | Database["public"]["Enums"]["package_type"]
            | null
          default_shipping_method:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          email: string
          full_name: string
          id: string
          last_active: string
          notify_email: boolean
          notify_push: boolean
          notify_sms: boolean
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          state: string
          two_factor_enabled: boolean
          username: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string
          city?: string
          company?: string | null
          country?: string
          created_at?: string
          default_instructions?: string | null
          default_package_type?:
            | Database["public"]["Enums"]["package_type"]
            | null
          default_shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          email: string
          full_name?: string
          id: string
          last_active?: string
          notify_email?: boolean
          notify_push?: boolean
          notify_sms?: boolean
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          state?: string
          two_factor_enabled?: boolean
          username?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string
          city?: string
          company?: string | null
          country?: string
          created_at?: string
          default_instructions?: string | null
          default_package_type?:
            | Database["public"]["Enums"]["package_type"]
            | null
          default_shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          email?: string
          full_name?: string
          id?: string
          last_active?: string
          notify_email?: boolean
          notify_push?: boolean
          notify_sms?: boolean
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          state?: string
          two_factor_enabled?: boolean
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          message: string
          rating: number
          shipment_id: string | null
          title: string
          tracking_number: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string
          rating: number
          shipment_id?: string | null
          title?: string
          tracking_number?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string
          rating?: number
          shipment_id?: string | null
          title?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_images: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          public_url: string
          shipment_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          public_url: string
          shipment_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          public_url?: string
          shipment_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_images_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cost: number
          created_at: string
          currency: string
          current_location: string
          customer_id: string | null
          destination: string
          dimensions: string
          estimated_delivery: string | null
          id: string
          instructions: string | null
          last_updated: string
          origin: string
          package_count: number
          package_type: Database["public"]["Enums"]["package_type"]
          recipient: Json
          sender: Json
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string
          weight: number
        }
        Insert: {
          cost?: number
          created_at?: string
          currency?: string
          current_location?: string
          customer_id?: string | null
          destination?: string
          dimensions?: string
          estimated_delivery?: string | null
          id?: string
          instructions?: string | null
          last_updated?: string
          origin?: string
          package_count?: number
          package_type?: Database["public"]["Enums"]["package_type"]
          recipient?: Json
          sender?: Json
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string
          weight?: number
        }
        Update: {
          cost?: number
          created_at?: string
          currency?: string
          current_location?: string
          customer_id?: string | null
          destination?: string
          dimensions?: string
          estimated_delivery?: string | null
          id?: string
          instructions?: string | null
          last_updated?: string
          origin?: string
          package_count?: number
          package_type?: Database["public"]["Enums"]["package_type"]
          recipient?: Json
          sender?: Json
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          read_at: string | null
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          shipment_id: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          shipment_id?: string | null
          subject?: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
          shipment_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          description: string
          event_date: string
          event_time: string
          id: string
          location: string
          occurred_at: string | null
          shipment_id: string
          state: Database["public"]["Enums"]["event_state"]
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string
          id?: string
          location?: string
          occurred_at?: string | null
          shipment_id: string
          state?: Database["public"]["Enums"]["event_state"]
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string
          id?: string
          location?: string
          occurred_at?: string | null
          shipment_id?: string
          state?: Database["public"]["Enums"]["event_state"]
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      account_status: "Active" | "Suspended" | "Pending"
      activity_type:
        | "admin_logged_in"
        | "admin_profile_updated"
        | "admin_password_changed"
        | "customer_registered"
        | "shipment_created"
        | "shipment_status_changed"
        | "tracking_event_added"
        | "shipment_delivered"
        | "customer_updated"
      event_state: "completed" | "current" | "upcoming"
      message_sender_role: "admin" | "customer" | "system"
      notification_type:
        | "shipment_created"
        | "package_picked_up"
        | "shipment_in_transit"
        | "shipment_arrived_facility"
        | "shipment_out_for_delivery"
        | "shipment_delivered"
        | "delivery_exception"
        | "shipment_confirmed"
        | "account_welcome"
      package_type: "Box" | "Envelope" | "Pallet" | "Crate" | "Tube"
      shipment_status:
        | "Order Created"
        | "Confirmed"
        | "Picked Up"
        | "In Transit"
        | "Arrived at Facility"
        | "Out for Delivery"
        | "Delivered"
        | "Exception"
      shipping_method: "Standard" | "Express" | "Premium" | "International"
      user_role: "customer" | "admin"
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
      account_status: ["Active", "Suspended", "Pending"],
      activity_type: [
        "admin_logged_in",
        "admin_profile_updated",
        "admin_password_changed",
        "customer_registered",
        "shipment_created",
        "shipment_status_changed",
        "tracking_event_added",
        "shipment_delivered",
        "customer_updated",
      ],
      event_state: ["completed", "current", "upcoming"],
      message_sender_role: ["admin", "customer", "system"],
      notification_type: [
        "shipment_created",
        "package_picked_up",
        "shipment_in_transit",
        "shipment_arrived_facility",
        "shipment_out_for_delivery",
        "shipment_delivered",
        "delivery_exception",
        "shipment_confirmed",
        "account_welcome",
      ],
      package_type: ["Box", "Envelope", "Pallet", "Crate", "Tube"],
      shipment_status: [
        "Order Created",
        "Confirmed",
        "Picked Up",
        "In Transit",
        "Arrived at Facility",
        "Out for Delivery",
        "Delivered",
        "Exception",
      ],
      shipping_method: ["Standard", "Express", "Premium", "International"],
      user_role: ["customer", "admin"],
    },
  },
} as const
