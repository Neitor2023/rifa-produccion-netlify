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
      fraud_reports: {
        Row: {
          created_at: string | null
          estado: string
          id: string
          mensaje: string
          participant_id: string | null
          raffle_id: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string
          id?: string
          mensaje: string
          participant_id?: string | null
          raffle_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          id?: string
          mensaje?: string
          participant_id?: string | null
          raffle_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_reports_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizador_entregas: {
        Row: {
          created_at: string | null
          entregado: boolean | null
          id: string
          metodo_pago: string | null
          observaciones: string | null
          organizer_id: string | null
          raffle_id: string | null
          total_entregado: number | null
        }
        Insert: {
          created_at?: string | null
          entregado?: boolean | null
          id?: string
          metodo_pago?: string | null
          observaciones?: string | null
          organizer_id?: string | null
          raffle_id?: string | null
          total_entregado?: number | null
        }
        Update: {
          created_at?: string | null
          entregado?: boolean | null
          id?: string
          metodo_pago?: string | null
          observaciones?: string | null
          organizer_id?: string | null
          raffle_id?: string | null
          total_entregado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organizador_entregas_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizador_entregas_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          admin_name: string | null
          admin_phone_number: string | null
          admin_photo: string | null
          background_color: string | null
          created_at: string | null
          id: string
          image_apartado: string | null
          image_checklist: string | null
          imagen_pago: string | null
          imagen_publicitaria: string | null
          modal: string | null
          org_name: string | null
          org_phone_number: string | null
          org_photo: string | null
          organization_logo_url: string | null
          organization_name: string | null
          select_language: string | null
          updated_at: string | null
        }
        Insert: {
          admin_name?: string | null
          admin_phone_number?: string | null
          admin_photo?: string | null
          background_color?: string | null
          created_at?: string | null
          id?: string
          image_apartado?: string | null
          image_checklist?: string | null
          imagen_pago?: string | null
          imagen_publicitaria?: string | null
          modal?: string | null
          org_name?: string | null
          org_phone_number?: string | null
          org_photo?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          select_language?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_name?: string | null
          admin_phone_number?: string | null
          admin_photo?: string | null
          background_color?: string | null
          created_at?: string | null
          id?: string
          image_apartado?: string | null
          image_checklist?: string | null
          imagen_pago?: string | null
          imagen_publicitaria?: string | null
          modal?: string | null
          org_name?: string | null
          org_phone_number?: string | null
          org_photo?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          select_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          cedula: string | null
          created_at: string | null
          deleted_at: string | null
          direccion: string | null
          email: string
          id: string
          name: string
          nota: string | null
          phone: string
          raffle_id: string | null
          seller_id: string | null
          sugerencia_producto: string | null
          updated_at: string | null
        }
        Insert: {
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          direccion?: string | null
          email: string
          id?: string
          name: string
          nota?: string | null
          phone: string
          raffle_id?: string | null
          seller_id?: string | null
          sugerencia_producto?: string | null
          updated_at?: string | null
        }
        Update: {
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          direccion?: string | null
          email?: string
          id?: string
          name?: string
          nota?: string | null
          phone?: string
          raffle_id?: string | null
          seller_id?: string | null
          sugerencia_producto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          detail: string | null
          id: string
          name: string
          private_note: string | null
          raffle_id: string | null
          updated_at: string | null
          url_image: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          detail?: string | null
          id?: string
          name: string
          private_note?: string | null
          raffle_id?: string | null
          updated_at?: string | null
          url_image?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          detail?: string | null
          id?: string
          name?: string
          private_note?: string | null
          raffle_id?: string | null
          updated_at?: string | null
          url_image?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "prizes_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_customizations: {
        Row: {
          background_image: string | null
          created_at: string | null
          deleted_at: string | null
          font_family: string | null
          id: string
          logo: string | null
          primary_color: string
          raffle_id: string | null
          secondary_color: string
          show_countdown: boolean
          show_progress_bar: boolean
          updated_at: string | null
        }
        Insert: {
          background_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          font_family?: string | null
          id?: string
          logo?: string | null
          primary_color: string
          raffle_id?: string | null
          secondary_color: string
          show_countdown: boolean
          show_progress_bar: boolean
          updated_at?: string | null
        }
        Update: {
          background_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          font_family?: string | null
          id?: string
          logo?: string | null
          primary_color?: string
          raffle_id?: string | null
          secondary_color?: string
          show_countdown?: boolean
          show_progress_bar?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_customizations_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_numbers: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          number: number
          participant_cedula: string | null
          participant_id: string | null
          participant_name: string | null
          participant_phone: string | null
          payment_approved: boolean | null
          payment_proof: string | null
          raffle_id: string | null
          reservation_expires_at: string | null
          seller_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          number: number
          participant_cedula?: string | null
          participant_id?: string | null
          participant_name?: string | null
          participant_phone?: string | null
          payment_approved?: boolean | null
          payment_proof?: string | null
          raffle_id?: string | null
          reservation_expires_at?: string | null
          seller_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          number?: number
          participant_cedula?: string | null
          participant_id?: string | null
          participant_name?: string | null
          participant_phone?: string | null
          payment_approved?: boolean | null
          payment_proof?: string | null
          raffle_id?: string | null
          reservation_expires_at?: string | null
          seller_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_numbers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_numbers_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_numbers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_prize_images: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          image_url: string
          prize_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url: string
          prize_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string
          prize_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_prize_images_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_sellers: {
        Row: {
          active: boolean | null
          allow_voucher_print: boolean | null
          assigned_at: string | null
          cant_max: number | null
          created_at: string | null
          deleted_at: string | null
          id: string
          raffle_id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          allow_voucher_print?: boolean | null
          assigned_at?: string | null
          cant_max?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          raffle_id: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          allow_voucher_print?: boolean | null
          assigned_at?: string | null
          cant_max?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          raffle_id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_sellers_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_sellers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          copy_writing: string | null
          created_at: string | null
          currency: string
          date_lottery: string | null
          deleted_at: string | null
          description: string
          draw_date: string
          id: string
          id_admin: string | null
          id_organizer: string | null
          lottery: string | null
          mini_instructivo: string | null
          modal: string | null
          payment_instructions: string | null
          price: number
          reservation_days: number | null
          status: string
          title: string
          total_numbers: number
          updated_at: string | null
          url_image: string
          url_sellers: string | null
        }
        Insert: {
          copy_writing?: string | null
          created_at?: string | null
          currency: string
          date_lottery?: string | null
          deleted_at?: string | null
          description: string
          draw_date: string
          id?: string
          id_admin?: string | null
          id_organizer?: string | null
          lottery?: string | null
          mini_instructivo?: string | null
          modal?: string | null
          payment_instructions?: string | null
          price: number
          reservation_days?: number | null
          status: string
          title: string
          total_numbers: number
          updated_at?: string | null
          url_image: string
          url_sellers?: string | null
        }
        Update: {
          copy_writing?: string | null
          created_at?: string | null
          currency?: string
          date_lottery?: string | null
          deleted_at?: string | null
          description?: string
          draw_date?: string
          id?: string
          id_admin?: string | null
          id_organizer?: string | null
          lottery?: string | null
          mini_instructivo?: string | null
          modal?: string | null
          payment_instructions?: string | null
          price?: number
          reservation_days?: number | null
          status?: string
          title?: string
          total_numbers?: number
          updated_at?: string | null
          url_image?: string
          url_sellers?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_raffles_admin"
            columns: ["id_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_raffles_organizer"
            columns: ["id_organizer"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          active: boolean
          avatar: string | null
          cedula: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          end_number: number
          id: string
          name: string
          password_hash: string | null
          phone: string | null
          raffle_id: string | null
          start_number: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          avatar?: string | null
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          end_number: number
          id?: string
          name: string
          password_hash?: string | null
          phone?: string | null
          raffle_id?: string | null
          start_number: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          avatar?: string | null
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          end_number?: number
          id?: string
          name?: string
          password_hash?: string | null
          phone?: string | null
          raffle_id?: string | null
          start_number?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          name: string
          password_hash: string
          phone_number: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          phone_number?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          phone_number?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vendedor_entregas: {
        Row: {
          created_at: string | null
          efectivo: number | null
          entregado: boolean | null
          id: string
          observaciones: string | null
          raffle_id: string | null
          seller_id: string | null
          total_entregado: number | null
          transferencia: number | null
        }
        Insert: {
          created_at?: string | null
          efectivo?: number | null
          entregado?: boolean | null
          id?: string
          observaciones?: string | null
          raffle_id?: string | null
          seller_id?: string | null
          total_entregado?: number | null
          transferencia?: number | null
        }
        Update: {
          created_at?: string | null
          efectivo?: number | null
          entregado?: boolean | null
          id?: string
          observaciones?: string | null
          raffle_id?: string | null
          seller_id?: string | null
          total_entregado?: number | null
          transferencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendedor_entregas_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendedor_entregas_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
