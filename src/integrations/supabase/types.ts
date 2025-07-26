export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      automation_requests: {
        Row: {
          admin_email: string
          company_name: string
          completed_at: string | null
          created_at: string
          credentials: Json | null
          error_message: string | null
          id: string
          job_id: string
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          admin_email: string
          company_name: string
          completed_at?: string | null
          created_at?: string
          credentials?: Json | null
          error_message?: string | null
          id?: string
          job_id: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          admin_email?: string
          company_name?: string
          completed_at?: string | null
          created_at?: string
          credentials?: Json | null
          error_message?: string | null
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      availability_calendar: {
        Row: {
          assignment_details: Json | null
          created_at: string
          date: string
          id: string
          resource_id: string
          resource_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assignment_details?: Json | null
          created_at?: string
          date: string
          id?: string
          resource_id: string
          resource_type: string
          status: string
          updated_at?: string
        }
        Update: {
          assignment_details?: Json | null
          created_at?: string
          date?: string
          id?: string
          resource_id?: string
          resource_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          close_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string | null
          customer_id: string
          event_timestamp: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          customer_id: string
          event_timestamp?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          customer_id?: string
          event_timestamp?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          is_system: boolean | null
          name: string
          source: string | null
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_system?: boolean | null
          name: string
          source?: string | null
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_system?: boolean | null
          name?: string
          source?: string | null
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_maintenance_settings: {
        Row: {
          created_at: string
          data_retention_days: number | null
          default_notification_advance_days: number | null
          enable_inhouse_features: boolean | null
          id: string
          notification_email: string | null
          notification_phone: string | null
          notification_send_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_retention_days?: number | null
          default_notification_advance_days?: number | null
          enable_inhouse_features?: boolean | null
          id?: string
          notification_email?: string | null
          notification_phone?: string | null
          notification_send_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_retention_days?: number | null
          default_notification_advance_days?: number | null
          enable_inhouse_features?: boolean | null
          id?: string
          notification_email?: string | null
          notification_phone?: string | null
          notification_send_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          cleaning_prefix: string | null
          company_address: string | null
          company_city: string | null
          company_email: string | null
          company_logo: string | null
          company_name: string
          company_phone: string | null
          company_state: string | null
          company_street: string | null
          company_street2: string | null
          company_timezone: string | null
          company_zipcode: string | null
          created_at: string | null
          default_payment_terms_days: number | null
          default_quote_expiration_days: number | null
          default_rental_period_days: number | null
          delivery_prefix: string | null
          id: string
          invoice_number_prefix: string | null
          next_cleaning_number: number | null
          next_delivery_number: number | null
          next_invoice_number: number | null
          next_pickup_number: number | null
          next_quote_number: number | null
          next_return_number: number | null
          next_service_number: number | null
          pickup_prefix: string | null
          qr_feedback_email: string | null
          qr_feedback_notifications_enabled: boolean | null
          quote_number_prefix: string | null
          return_prefix: string | null
          service_prefix: string | null
          support_email: string | null
          updated_at: string | null
        }
        Insert: {
          cleaning_prefix?: string | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string
          company_phone?: string | null
          company_state?: string | null
          company_street?: string | null
          company_street2?: string | null
          company_timezone?: string | null
          company_zipcode?: string | null
          created_at?: string | null
          default_payment_terms_days?: number | null
          default_quote_expiration_days?: number | null
          default_rental_period_days?: number | null
          delivery_prefix?: string | null
          id?: string
          invoice_number_prefix?: string | null
          next_cleaning_number?: number | null
          next_delivery_number?: number | null
          next_invoice_number?: number | null
          next_pickup_number?: number | null
          next_quote_number?: number | null
          next_return_number?: number | null
          next_service_number?: number | null
          pickup_prefix?: string | null
          qr_feedback_email?: string | null
          qr_feedback_notifications_enabled?: boolean | null
          quote_number_prefix?: string | null
          return_prefix?: string | null
          service_prefix?: string | null
          support_email?: string | null
          updated_at?: string | null
        }
        Update: {
          cleaning_prefix?: string | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string
          company_phone?: string | null
          company_state?: string | null
          company_street?: string | null
          company_street2?: string | null
          company_timezone?: string | null
          company_zipcode?: string | null
          created_at?: string | null
          default_payment_terms_days?: number | null
          default_quote_expiration_days?: number | null
          default_rental_period_days?: number | null
          delivery_prefix?: string | null
          id?: string
          invoice_number_prefix?: string | null
          next_cleaning_number?: number | null
          next_delivery_number?: number | null
          next_invoice_number?: number | null
          next_pickup_number?: number | null
          next_quote_number?: number | null
          next_return_number?: number | null
          next_service_number?: number | null
          pickup_prefix?: string | null
          qr_feedback_email?: string | null
          qr_feedback_notifications_enabled?: boolean | null
          quote_number_prefix?: string | null
          return_prefix?: string | null
          service_prefix?: string | null
          support_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_document_types: {
        Row: {
          created_at: string
          default_reminder_days: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_reminder_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_reminder_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consumable_bundle_items: {
        Row: {
          bundle_id: string
          consumable_id: string
          created_at: string
          id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          consumable_id: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          consumable_id?: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumable_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "consumable_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_bundle_items_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
        ]
      }
      consumable_bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      consumable_location_stock: {
        Row: {
          consumable_id: string
          created_at: string
          id: string
          quantity: number
          storage_location_id: string
          updated_at: string
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          quantity?: number
          storage_location_id: string
          updated_at?: string
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          quantity?: number
          storage_location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consumable_location_stock_consumable"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consumable_location_stock_location"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      consumable_notification_settings: {
        Row: {
          business_hours_only: boolean
          created_at: string
          dashboard_alerts: boolean
          email_notifications: boolean
          email_recipients: string[] | null
          id: string
          low_stock_enabled: boolean
          low_stock_threshold_days: number
          notification_frequency: string
          sms_notifications: boolean
          sms_recipients: string[] | null
          updated_at: string
        }
        Insert: {
          business_hours_only?: boolean
          created_at?: string
          dashboard_alerts?: boolean
          email_notifications?: boolean
          email_recipients?: string[] | null
          id?: string
          low_stock_enabled?: boolean
          low_stock_threshold_days?: number
          notification_frequency?: string
          sms_notifications?: boolean
          sms_recipients?: string[] | null
          updated_at?: string
        }
        Update: {
          business_hours_only?: boolean
          created_at?: string
          dashboard_alerts?: boolean
          email_notifications?: boolean
          email_recipients?: string[] | null
          id?: string
          low_stock_enabled?: boolean
          low_stock_threshold_days?: number
          notification_frequency?: string
          sms_notifications?: boolean
          sms_recipients?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      consumable_stock_adjustments: {
        Row: {
          adjusted_by: string | null
          adjustment_type: string
          consumable_id: string
          created_at: string
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity_change: number
          reason: string
          reference_id: string | null
          storage_location_id: string | null
        }
        Insert: {
          adjusted_by?: string | null
          adjustment_type: string
          consumable_id: string
          created_at?: string
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          quantity_change: number
          reason: string
          reference_id?: string | null
          storage_location_id?: string | null
        }
        Update: {
          adjusted_by?: string | null
          adjustment_type?: string
          consumable_id?: string
          created_at?: string
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity_change?: number
          reason?: string
          reference_id?: string | null
          storage_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumable_stock_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_stock_adjustments_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
        ]
      }
      consumables: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          default_storage_location_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          on_hand_qty: number
          reorder_threshold: number
          sku: string | null
          supplier_info: Json | null
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          default_storage_location_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          on_hand_qty?: number
          reorder_threshold?: number
          sku?: string | null
          supplier_info?: Json | null
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_storage_location_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          on_hand_qty?: number
          reorder_threshold?: number
          sku?: string | null
          supplier_info?: Json | null
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinate_equipment_assignments: {
        Row: {
          coordinate_id: string
          created_at: string
          equipment_assignment_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          coordinate_id: string
          created_at?: string
          equipment_assignment_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          coordinate_id?: string
          created_at?: string
          equipment_assignment_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_coordinate_equipment_assignments_coordinate"
            columns: ["coordinate_id"]
            isOneToOne: false
            referencedRelation: "service_location_coordinates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coordinate_equipment_assignments_equipment"
            columns: ["equipment_assignment_id"]
            isOneToOne: true
            referencedRelation: "equipment_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_reports: {
        Row: {
          chart_type: string | null
          configuration: Json
          created_at: string | null
          created_by: string | null
          data_source: string
          description: string | null
          filters: Json | null
          grouping: Json | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          name: string
          report_type: string
          sorting: Json | null
          updated_at: string | null
        }
        Insert: {
          chart_type?: string | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          data_source: string
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name: string
          report_type: string
          sorting?: Json | null
          updated_at?: string | null
        }
        Update: {
          chart_type?: string | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          data_source?: string
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name?: string
          report_type?: string
          sorting?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_categories: {
        Row: {
          category_name: string
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_categories_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          campaign_id: string | null
          click_tracking_enabled: boolean | null
          content: string
          customer_id: string
          email_address: string | null
          id: string
          image_url: string | null
          phone_number: string | null
          resend_email_id: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string | null
          template_id: string | null
          type: string
        }
        Insert: {
          campaign_id?: string | null
          click_tracking_enabled?: boolean | null
          content: string
          customer_id: string
          email_address?: string | null
          id?: string
          image_url?: string | null
          phone_number?: string | null
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          type: string
        }
        Update: {
          campaign_id?: string | null
          click_tracking_enabled?: boolean | null
          content?: string
          customer_id?: string
          email_address?: string | null
          id?: string
          image_url?: string | null
          phone_number?: string | null
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          contact_type: string
          created_at: string | null
          customer_id: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          customer_id: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          customer_id?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interaction_logs: {
        Row: {
          contact_person: string | null
          content: string
          created_at: string
          customer_id: string
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          interaction_method: string | null
          interaction_type: string
          job_id: string | null
          location_lat: number | null
          location_lng: number | null
          metadata: Json | null
          outcome: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_person?: string | null
          content: string
          created_at?: string
          customer_id: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_method?: string | null
          interaction_type: string
          job_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          outcome?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_person?: string | null
          content?: string
          created_at?: string
          customer_id?: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_method?: string | null
          interaction_type?: string
          job_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          outcome?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_interaction_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interaction_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          is_important: boolean | null
          note_text: string
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          is_important?: boolean | null
          note_text: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          is_important?: boolean | null
          note_text?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_tokens: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          features: Json | null
          id: string
          one_time_use: boolean | null
          revoked_at: string | null
          token: string
          usage_count: number | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          features?: Json | null
          id?: string
          one_time_use?: boolean | null
          revoked_at?: string | null
          token: string
          usage_count?: number | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          features?: Json | null
          id?: string
          one_time_use?: boolean | null
          revoked_at?: string | null
          token?: string
          usage_count?: number | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string | null
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rule_set: Json
          segment_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rule_set?: Json
          segment_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rule_set?: Json
          segment_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_service_locations: {
        Row: {
          access_instructions: string | null
          city: string | null
          contact_person: string | null
          contact_phone: string | null
          coordinate_points: Json | null
          created_at: string | null
          customer_id: string
          gps_coordinates: unknown | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          is_locked: boolean | null
          location_description: string | null
          location_name: string
          notes: string | null
          state: string | null
          street: string | null
          street2: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          access_instructions?: string | null
          city?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          coordinate_points?: Json | null
          created_at?: string | null
          customer_id: string
          gps_coordinates?: unknown | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_locked?: boolean | null
          location_description?: string | null
          location_name: string
          notes?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          access_instructions?: string | null
          city?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          coordinate_points?: Json | null
          created_at?: string | null
          customer_id?: string
          gps_coordinates?: unknown | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_locked?: boolean | null
          location_description?: string | null
          location_name?: string
          notes?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_service_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_stats: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          outstanding_balance: number
          total_jobs: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          outstanding_balance?: number
          total_jobs?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          outstanding_balance?: number
          total_jobs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_stats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          billing_address: string | null
          billing_city: string | null
          billing_differs_from_service: boolean
          billing_state: string | null
          billing_street: string | null
          billing_street2: string | null
          billing_zip: string | null
          clerk_user_id: string | null
          created_at: string
          credit_not_approved: boolean | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          default_service_city: string | null
          default_service_differs_from_main: boolean | null
          default_service_state: string | null
          default_service_street: string | null
          default_service_street2: string | null
          default_service_zip: string | null
          deposit_required: boolean
          email: string | null
          id: string
          important_information: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          service_address: string | null
          service_city: string | null
          service_state: string | null
          service_street: string | null
          service_street2: string | null
          service_zip: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_differs_from_service?: boolean
          billing_state?: string | null
          billing_street?: string | null
          billing_street2?: string | null
          billing_zip?: string | null
          clerk_user_id?: string | null
          created_at?: string
          credit_not_approved?: boolean | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          default_service_city?: string | null
          default_service_differs_from_main?: boolean | null
          default_service_state?: string | null
          default_service_street?: string | null
          default_service_street2?: string | null
          default_service_zip?: string | null
          deposit_required?: boolean
          email?: string | null
          id?: string
          important_information?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          service_address?: string | null
          service_city?: string | null
          service_state?: string | null
          service_street?: string | null
          service_street2?: string | null
          service_zip?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_differs_from_service?: boolean
          billing_state?: string | null
          billing_street?: string | null
          billing_street2?: string | null
          billing_zip?: string | null
          clerk_user_id?: string | null
          created_at?: string
          credit_not_approved?: boolean | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          default_service_city?: string | null
          default_service_differs_from_main?: boolean | null
          default_service_state?: string | null
          default_service_street?: string | null
          default_service_street2?: string | null
          default_service_zip?: string | null
          deposit_required?: boolean
          email?: string | null
          id?: string
          important_information?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          service_address?: string | null
          service_city?: string | null
          service_state?: string | null
          service_street?: string | null
          service_street2?: string | null
          service_zip?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_vehicle_assignments: {
        Row: {
          assignment_date: string
          created_at: string | null
          driver_id: string
          end_mileage: number | null
          id: string
          notes: string | null
          start_mileage: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assignment_date: string
          created_at?: string | null
          driver_id: string
          end_mileage?: number | null
          id?: string
          notes?: string | null
          start_mileage?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assignment_date?: string
          created_at?: string | null
          driver_id?: string
          end_mileage?: number | null
          id?: string
          notes?: string | null
          start_mileage?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_vehicle_loads: {
        Row: {
          assigned_quantity: number
          created_at: string
          id: string
          load_date: string
          product_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_quantity?: number
          created_at?: string
          id?: string
          load_date: string
          product_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_quantity?: number
          created_at?: string
          id?: string
          load_date?: string
          product_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      dashboard_configurations: {
        Row: {
          created_at: string | null
          created_by: string | null
          dashboard_type: string
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          permissions: Json | null
          updated_at: string | null
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dashboard_type: string
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          permissions?: Json | null
          updated_at?: string | null
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dashboard_type?: string
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          permissions?: Json | null
          updated_at?: string | null
          widgets?: Json
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      driver_time_off_requests: {
        Row: {
          created_at: string
          driver_id: string
          end_time: string | null
          id: string
          reason: string | null
          request_date: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_time: string | null
          status: string
          time_slot: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          end_time?: string | null
          id?: string
          reason?: string | null
          request_date: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: string
          time_slot?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          request_date?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: string
          time_slot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_driver_time_off_requests_profiles"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          driver_id: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          driver_id: string
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          driver_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_working_hours_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          campaign_name: string
          campaign_type: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          recipient_filters: Json | null
          status: string
          subject: string | null
          template_id: string | null
          total_recipients: number
          updated_at: string
        }
        Insert: {
          campaign_name: string
          campaign_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          recipient_filters?: Json | null
          status?: string
          subject?: string | null
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          campaign_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          recipient_filters?: Json | null
          status?: string
          subject?: string | null
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking_events: {
        Row: {
          campaign_id: string | null
          communication_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          link_url: string | null
          occurred_at: string
          recipient_email: string
          resend_event_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          communication_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          occurred_at?: string
          recipient_email: string
          resend_event_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          communication_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          occurred_at?: string
          recipient_email?: string
          resend_event_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_events_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "customer_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_assignments: {
        Row: {
          assigned_date: string
          coordinate_assigned: boolean | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          product_id: string | null
          product_item_id: string | null
          quantity: number | null
          return_date: string | null
          source_storage_location_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_date: string
          coordinate_assigned?: boolean | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          product_id?: string | null
          product_item_id?: string | null
          quantity?: number | null
          return_date?: string | null
          source_storage_location_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          coordinate_assigned?: boolean | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          product_id?: string | null
          product_item_id?: string | null
          quantity?: number | null
          return_date?: string | null
          source_storage_location_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports: {
        Row: {
          context: Json | null
          created_at: string | null
          error_type: string
          id: string
          message: string
          reported_at: string
          severity: string
          stack_trace: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_type: string
          id?: string
          message: string
          reported_at: string
          severity: string
          stack_trace?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_type?: string
          id?: string
          message?: string
          reported_at?: string
          severity?: string
          stack_trace?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fleet_utilization_analytics: {
        Row: {
          created_at: string
          date: string
          efficiency_score: number
          id: string
          total_capacity: number
          updated_at: string
          utilization_percentage: number
          utilized_capacity: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date: string
          efficiency_score?: number
          id?: string
          total_capacity?: number
          updated_at?: string
          utilization_percentage?: number
          utilized_capacity?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          efficiency_score?: number
          id?: string
          total_capacity?: number
          updated_at?: string
          utilization_percentage?: number
          utilized_capacity?: number
          vehicle_id?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost_per_gallon: number
          created_at: string | null
          driver_id: string
          fuel_station: string | null
          gallons_purchased: number
          id: string
          log_date: string
          notes: string | null
          odometer_reading: number
          receipt_image: string | null
          total_cost: number
          vehicle_id: string
        }
        Insert: {
          cost_per_gallon: number
          created_at?: string | null
          driver_id: string
          fuel_station?: string | null
          gallons_purchased: number
          id?: string
          log_date?: string
          notes?: string | null
          odometer_reading: number
          receipt_image?: string | null
          total_cost: number
          vehicle_id: string
        }
        Update: {
          cost_per_gallon?: number
          created_at?: string | null
          driver_id?: string
          fuel_station?: string | null
          gallons_purchased?: number
          id?: string
          log_date?: string
          notes?: string | null
          odometer_reading?: number
          receipt_image?: string | null
          total_cost?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_settings: {
        Row: {
          auto_calculate_mpg: boolean
          company_id: string | null
          created_at: string
          csv_mapping_templates: Json | null
          currency_format: string
          default_fuel_station_id: string | null
          driver_edit_permission: boolean
          fuel_unit: string
          id: string
          manager_approval_threshold: number | null
          odometer_precision: number
          require_receipt: boolean
          updated_at: string
        }
        Insert: {
          auto_calculate_mpg?: boolean
          company_id?: string | null
          created_at?: string
          csv_mapping_templates?: Json | null
          currency_format?: string
          default_fuel_station_id?: string | null
          driver_edit_permission?: boolean
          fuel_unit?: string
          id?: string
          manager_approval_threshold?: number | null
          odometer_precision?: number
          require_receipt?: boolean
          updated_at?: string
        }
        Update: {
          auto_calculate_mpg?: boolean
          company_id?: string | null
          created_at?: string
          csv_mapping_templates?: Json | null
          currency_format?: string
          default_fuel_station_id?: string | null
          driver_edit_permission?: boolean
          fuel_unit?: string
          id?: string
          manager_approval_threshold?: number | null
          odometer_precision?: number
          require_receipt?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      fuel_stations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          default_cost_per_gallon: number | null
          gps_coordinates: unknown | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          street: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          default_cost_per_gallon?: number | null
          gps_coordinates?: unknown | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          default_cost_per_gallon?: number | null
          gps_coordinates?: unknown | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      instance_deployments: {
        Row: {
          automation_request_id: string | null
          completed_at: string | null
          created_at: string | null
          deployment_data: Json | null
          deployment_type: string
          deployment_url: string | null
          error_message: string | null
          id: string
          status: string | null
        }
        Insert: {
          automation_request_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deployment_data?: Json | null
          deployment_type: string
          deployment_url?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          automation_request_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deployment_data?: Json | null
          deployment_type?: string
          deployment_url?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instance_deployments_automation_request_id_fkey"
            columns: ["automation_request_id"]
            isOneToOne: false
            referencedRelation: "automation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          line_item_type: string | null
          line_total: number
          product_id: string | null
          product_name: string
          product_variation_id: string | null
          quantity: number
          service_frequency: string | null
          service_hours: number | null
          service_id: string | null
          service_notes: string | null
          unit_price: number
          updated_at: string | null
          variation_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          line_item_type?: string | null
          line_total: number
          product_id?: string | null
          product_name: string
          product_variation_id?: string | null
          quantity: number
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          unit_price: number
          updated_at?: string | null
          variation_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          line_item_type?: string | null
          line_total?: number
          product_id?: string | null
          product_name?: string
          product_variation_id?: string | null
          quantity?: number
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          unit_price?: number
          updated_at?: string | null
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "routine_maintenance_services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_overdue_dismissals: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          invoice_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          invoice_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          invoice_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_overdue_dismissals_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          additional_fees: number | null
          amount: number
          created_at: string
          customer_id: string
          discount_type: string | null
          discount_value: number | null
          due_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          quote_id: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          additional_fees?: number | null
          amount: number
          created_at?: string
          customer_id: string
          discount_type?: string | null
          discount_value?: number | null
          due_date: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quote_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          additional_fees?: number | null
          amount?: number
          created_at?: string
          customer_id?: string
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quote_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "active_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_completion_verifications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          updated_at: string
          verification_data: Json | null
          verification_status: string
          verification_type: string
          verified_at: string | null
          verified_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          updated_at?: string
          verification_data?: Json | null
          verification_status?: string
          verification_type: string
          verified_at?: string | null
          verified_by: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          updated_at?: string
          verification_data?: Json | null
          verification_status?: string
          verification_type?: string
          verified_at?: string | null
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_completion_verifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_consumables: {
        Row: {
          consumable_id: string
          created_at: string
          id: string
          job_id: string
          line_total: number
          notes: string | null
          quantity: number
          unit_price: number
          used_at: string
          used_by: string | null
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          job_id: string
          line_total: number
          notes?: string | null
          quantity: number
          unit_price: number
          used_at?: string
          used_by?: string | null
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          job_id?: string
          line_total?: number
          notes?: string | null
          quantity?: number
          unit_price?: number
          used_at?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_consumables_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_consumables_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_consumables_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documentation: {
        Row: {
          created_at: string
          description: string | null
          document_category: string | null
          document_type: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          job_id: string
          location_lat: number | null
          location_lng: number | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_type: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          job_id: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          job_id?: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_documentation_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_equipment_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          condition_in: string | null
          condition_out: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          product_item_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_in?: string | null
          condition_out?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          product_item_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_in?: string | null
          condition_out?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          product_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_equipment_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_equipment_assignments_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      job_items: {
        Row: {
          created_at: string
          id: string
          job_id: string
          line_item_type: string | null
          product_id: string | null
          product_variation_id: string | null
          quantity: number
          service_config: Json | null
          service_custom_dates: Json | null
          service_frequency: string | null
          service_hours: number | null
          service_id: string | null
          service_notes: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          line_item_type?: string | null
          product_id?: string | null
          product_variation_id?: string | null
          quantity: number
          service_config?: Json | null
          service_custom_dates?: Json | null
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          line_item_type?: string | null
          product_id?: string | null
          product_variation_id?: string | null
          quantity?: number
          service_config?: Json | null
          service_custom_dates?: Json | null
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "routine_maintenance_services"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_completion_time: string | null
          billing_method: string | null
          created_at: string
          customer_id: string
          date_returned: string | null
          driver_id: string | null
          id: string
          is_service_job: boolean
          job_number: string
          job_type: string
          notes: string | null
          parent_job_id: string | null
          quote_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          selected_coordinate_ids: Json | null
          service_due_date: string | null
          service_schedule_info: Json | null
          special_instructions: string | null
          status: string
          subscription_plan: string | null
          timezone: string | null
          total_price: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          actual_completion_time?: string | null
          billing_method?: string | null
          created_at?: string
          customer_id: string
          date_returned?: string | null
          driver_id?: string | null
          id?: string
          is_service_job?: boolean
          job_number?: string
          job_type: string
          notes?: string | null
          parent_job_id?: string | null
          quote_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          selected_coordinate_ids?: Json | null
          service_due_date?: string | null
          service_schedule_info?: Json | null
          special_instructions?: string | null
          status?: string
          subscription_plan?: string | null
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          actual_completion_time?: string | null
          billing_method?: string | null
          created_at?: string
          customer_id?: string
          date_returned?: string | null
          driver_id?: string | null
          id?: string
          is_service_job?: boolean
          job_number?: string
          job_type?: string
          notes?: string | null
          parent_job_id?: string | null
          quote_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          selected_coordinate_ids?: Json | null
          service_due_date?: string | null
          service_schedule_info?: Json | null
          special_instructions?: string | null
          status?: string
          subscription_plan?: string | null
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "active_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      load_compliance_reports: {
        Row: {
          capacity_violations: number | null
          compliance_score: number | null
          created_at: string
          efficiency_below_threshold: number | null
          generated_by: string | null
          id: string
          report_data: Json
          report_date: string
          vehicle_id: string
          weight_violations: number | null
        }
        Insert: {
          capacity_violations?: number | null
          compliance_score?: number | null
          created_at?: string
          efficiency_below_threshold?: number | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_date: string
          vehicle_id: string
          weight_violations?: number | null
        }
        Update: {
          capacity_violations?: number | null
          compliance_score?: number | null
          created_at?: string
          efficiency_below_threshold?: number | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_date?: string
          vehicle_id?: string
          weight_violations?: number | null
        }
        Relationships: []
      }
      load_management_sync_log: {
        Row: {
          created_at: string
          device_info: Json | null
          driver_id: string
          id: string
          sync_data: Json
          sync_timestamp: string
          sync_type: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          driver_id: string
          id?: string
          sync_data?: Json
          sync_timestamp?: string
          sync_type: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          driver_id?: string
          id?: string
          sync_data?: Json
          sync_timestamp?: string
          sync_type?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      location_logs: {
        Row: {
          accuracy: number | null
          address: string | null
          altitude: number | null
          created_at: string
          heading: number | null
          id: string
          job_id: string | null
          latitude: number
          location_type: string
          longitude: number
          speed: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          job_id?: string | null
          latitude: number
          location_type?: string
          longitude: number
          speed?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          job_id?: string | null
          latitude?: number
          location_type?: string
          longitude?: number
          speed?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      location_time_logs: {
        Row: {
          arrival_time: string | null
          created_at: string
          departure_time: string | null
          id: string
          job_id: string
          location_id: string | null
          location_name: string | null
          notes: string | null
          updated_at: string
          user_id: string
          work_duration: number | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          departure_time?: string | null
          id?: string
          job_id: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          work_duration?: number | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          departure_time?: string | null
          id?: string
          job_id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          work_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "location_time_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_time_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notification_schedules: {
        Row: {
          created_at: string
          id: string
          maintenance_record_id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_record_id: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_record_id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_notification_schedules_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notification_settings: {
        Row: {
          created_at: string
          day_of_reminder: boolean
          default_mileage_threshold: number
          email_address: string | null
          email_enabled: boolean
          id: string
          mileage_reminder: boolean
          notification_time: string
          phone_number: string | null
          seven_day_reminder: boolean
          sms_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_reminder?: boolean
          default_mileage_threshold?: number
          email_address?: string | null
          email_enabled?: boolean
          id?: string
          mileage_reminder?: boolean
          notification_time?: string
          phone_number?: string | null
          seven_day_reminder?: boolean
          sms_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_reminder?: boolean
          default_mileage_threshold?: number
          email_address?: string | null
          email_enabled?: boolean
          id?: string
          mileage_reminder?: boolean
          notification_time?: string
          phone_number?: string | null
          seven_day_reminder?: boolean
          sms_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_parts: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          reorder_threshold: number | null
          sku: string | null
          storage_location_id: string | null
          supplier_info: Json | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reorder_threshold?: number | null
          sku?: string | null
          storage_location_id?: string | null
          supplier_info?: Json | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reorder_threshold?: number | null
          sku?: string | null
          storage_location_id?: string | null
          supplier_info?: Json | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_parts_usage: {
        Row: {
          created_at: string
          id: string
          maintenance_record_id: string
          notes: string | null
          part_id: string
          quantity_used: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_record_id: string
          notes?: string | null
          part_id: string
          quantity_used: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_record_id?: string
          notes?: string | null
          part_id?: string
          quantity_used?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_parts_usage_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "maintenance_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          actual_hours: number | null
          completed_date: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string
          estimated_hours: number | null
          id: string
          invoice_number: string | null
          labor_cost: number | null
          maintenance_type: string
          mileage_at_service: number | null
          next_service_date: string | null
          next_service_mileage: number | null
          notes: string | null
          notification_trigger_type: string | null
          parts_cost: number | null
          priority: string | null
          scheduled_date: string | null
          service_provider: string | null
          status: string
          task_type_id: string | null
          technician_id: string | null
          total_cost: number | null
          updated_at: string | null
          vehicle_id: string
          vendor_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimated_hours?: number | null
          id?: string
          invoice_number?: string | null
          labor_cost?: number | null
          maintenance_type: string
          mileage_at_service?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
          notes?: string | null
          notification_trigger_type?: string | null
          parts_cost?: number | null
          priority?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          status?: string
          task_type_id?: string | null
          technician_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id: string
          vendor_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimated_hours?: number | null
          id?: string
          invoice_number?: string | null
          labor_cost?: number | null
          maintenance_type?: string
          mileage_at_service?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
          notes?: string | null
          notification_trigger_type?: string | null
          parts_cost?: number | null
          priority?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          status?: string
          task_type_id?: string | null
          technician_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "maintenance_technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "maintenance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_report_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          report_id: string
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          report_id: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_report_templates: {
        Row: {
          approval_status: string | null
          created_at: string | null
          created_by: string | null
          current_version: number | null
          description: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          parent_template_id: string | null
          preview_image: string | null
          template_category: string | null
          template_data: Json
          template_status: string | null
          template_tags: string[] | null
          template_type: string
          template_version: number | null
          updated_at: string | null
          usage_count: number | null
          version_history_enabled: boolean | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          parent_template_id?: string | null
          preview_image?: string | null
          template_category?: string | null
          template_data: Json
          template_status?: string | null
          template_tags?: string[] | null
          template_type: string
          template_version?: number | null
          updated_at?: string | null
          usage_count?: number | null
          version_history_enabled?: boolean | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          parent_template_id?: string | null
          preview_image?: string | null
          template_category?: string | null
          template_data?: Json
          template_status?: string | null
          template_tags?: string[] | null
          template_type?: string
          template_version?: number | null
          updated_at?: string | null
          usage_count?: number | null
          version_history_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_report_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_reports: {
        Row: {
          actual_completion: string | null
          assigned_technician: string | null
          completed_at: string | null
          completed_by: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          duration_minutes: number | null
          estimated_completion: string | null
          id: string
          job_id: string | null
          location_coordinates: unknown | null
          priority_level: string | null
          report_data: Json
          report_number: string | null
          review_date: string | null
          reviewed_by: string | null
          status: string | null
          template_id: string
          updated_at: string | null
          weather_conditions: string | null
          workflow_status: string | null
        }
        Insert: {
          actual_completion?: string | null
          assigned_technician?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          duration_minutes?: number | null
          estimated_completion?: string | null
          id?: string
          job_id?: string | null
          location_coordinates?: unknown | null
          priority_level?: string | null
          report_data: Json
          report_number?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          weather_conditions?: string | null
          workflow_status?: string | null
        }
        Update: {
          actual_completion?: string | null
          assigned_technician?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          duration_minutes?: number | null
          estimated_completion?: string | null
          id?: string
          job_id?: string | null
          location_coordinates?: unknown | null
          priority_level?: string | null
          report_data?: Json
          report_number?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          weather_conditions?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reports_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_signatures: {
        Row: {
          created_at: string | null
          id: string
          report_id: string
          signature_data: string
          signature_type: string
          signed_at: string | null
          signer_name: string
          signer_role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_id: string
          signature_data: string
          signature_type: string
          signed_at?: string | null
          signer_name: string
          signer_role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          report_id?: string
          signature_data?: string
          signature_type?: string
          signed_at?: string | null
          signer_name?: string
          signer_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_signatures_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_task_types: {
        Row: {
          created_at: string
          default_cost: number | null
          default_interval_days: number | null
          default_interval_miles: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          required_technician_role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_cost?: number | null
          default_interval_days?: number | null
          default_interval_miles?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          required_technician_role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_cost?: number | null
          default_interval_days?: number | null
          default_interval_miles?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_technician_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_technicians: {
        Row: {
          created_at: string
          email: string | null
          employee_id: string | null
          first_name: string
          hired_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          specializations: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          first_name: string
          hired_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          first_name?: string
          hired_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      maintenance_vendors: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          service_specialties: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          service_specialties?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          service_specialties?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          bounced_count: number | null
          campaign_type: string
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          id: string
          name: string
          opened_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_customer_types: Json | null
          target_segments: Json | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          bounced_count?: number | null
          campaign_type: string
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          name: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_customer_types?: Json | null
          target_segments?: Json | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          bounced_count?: number | null
          campaign_type?: string
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          name?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_customer_types?: Json | null
          target_segments?: Json | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          delivery_results: Json | null
          id: string
          notification_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          delivery_results?: Json | null
          id?: string
          notification_type: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          delivery_results?: Json | null
          id?: string
          notification_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          job_status_change_email: boolean | null
          job_status_change_sms: boolean | null
          maintenance_email_7_day: boolean | null
          maintenance_email_day_of: boolean | null
          maintenance_mileage_email: boolean | null
          maintenance_mileage_sms: boolean | null
          maintenance_sms_7_day: boolean | null
          maintenance_sms_day_of: boolean | null
          new_job_assigned_email: boolean | null
          new_job_assigned_sms: boolean | null
          overdue_job_email: boolean | null
          overdue_job_sms: boolean | null
          phone_number: string | null
          quote_invoice_email: boolean | null
          quote_invoice_sms: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_status_change_email?: boolean | null
          job_status_change_sms?: boolean | null
          maintenance_email_7_day?: boolean | null
          maintenance_email_day_of?: boolean | null
          maintenance_mileage_email?: boolean | null
          maintenance_mileage_sms?: boolean | null
          maintenance_sms_7_day?: boolean | null
          maintenance_sms_day_of?: boolean | null
          new_job_assigned_email?: boolean | null
          new_job_assigned_sms?: boolean | null
          overdue_job_email?: boolean | null
          overdue_job_sms?: boolean | null
          phone_number?: string | null
          quote_invoice_email?: boolean | null
          quote_invoice_sms?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_status_change_email?: boolean | null
          job_status_change_sms?: boolean | null
          maintenance_email_7_day?: boolean | null
          maintenance_email_day_of?: boolean | null
          maintenance_mileage_email?: boolean | null
          maintenance_mileage_sms?: boolean | null
          maintenance_sms_7_day?: boolean | null
          maintenance_sms_day_of?: boolean | null
          new_job_assigned_email?: boolean | null
          new_job_assigned_sms?: boolean | null
          overdue_job_email?: boolean | null
          overdue_job_sms?: boolean | null
          phone_number?: string | null
          quote_invoice_email?: boolean | null
          quote_invoice_sms?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          subject: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          created_at: string
          data: Json
          id: string
          last_error: string | null
          operation: string
          record_id: string | null
          retry_count: number
          sync_status: string
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          last_error?: string | null
          operation: string
          record_id?: string | null
          retry_count?: number
          sync_status?: string
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          last_error?: string | null
          operation?: string
          record_id?: string | null
          retry_count?: number
          sync_status?: string
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      pin_categories: {
        Row: {
          color: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_surcharge: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          rule_type: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          adjustment_type: string
          adjustment_value: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_surcharge?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          rule_type: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_surcharge?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          rule_type?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_item_attributes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          property_id: string
          property_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          property_id: string
          property_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          property_id?: string
          property_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_item_attributes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_item_attributes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "product_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          barcode: string | null
          color: string | null
          condition: string | null
          created_at: string
          current_storage_location_id: string | null
          gps_enabled: boolean | null
          id: string
          interior_features: string[] | null
          item_code: string
          last_known_location: unknown | null
          last_location_update: string | null
          location: string | null
          material: string | null
          notes: string | null
          power_source: string | null
          product_id: string
          product_variation_id: string | null
          qr_code_data: string | null
          size: string | null
          status: string
          updated_at: string
          use_case: string | null
          winterized: boolean | null
        }
        Insert: {
          barcode?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_storage_location_id?: string | null
          gps_enabled?: boolean | null
          id?: string
          interior_features?: string[] | null
          item_code: string
          last_known_location?: unknown | null
          last_location_update?: string | null
          location?: string | null
          material?: string | null
          notes?: string | null
          power_source?: string | null
          product_id: string
          product_variation_id?: string | null
          qr_code_data?: string | null
          size?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          winterized?: boolean | null
        }
        Update: {
          barcode?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_storage_location_id?: string | null
          gps_enabled?: boolean | null
          id?: string
          interior_features?: string[] | null
          item_code?: string
          last_known_location?: unknown | null
          last_location_update?: string | null
          location?: string | null
          material?: string | null
          notes?: string | null
          power_source?: string | null
          product_id?: string
          product_variation_id?: string | null
          qr_code_data?: string | null
          size?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          winterized?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_location_stock: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          storage_location_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          storage_location_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          storage_location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_location_stock_location"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_location_stock_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_properties: {
        Row: {
          attribute_name: string
          attribute_value: string | null
          created_at: string
          id: string
          is_required: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          attribute_name: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          attribute_name?: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_properties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_property_assignments: {
        Row: {
          created_at: string
          id: string
          product_id: string
          property_variation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          property_variation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          property_variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_property_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_property_assignments_property_variation_id_fkey"
            columns: ["property_variation_id"]
            isOneToOne: false
            referencedRelation: "property_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string
          id: string
          product_id: string
          updated_at: string
          variation_image: string | null
          variation_name: string
          variation_price_modifier: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
          variation_image?: string | null
          variation_name: string
          variation_price_modifier?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
          variation_image?: string | null
          variation_name?: string
          variation_price_modifier?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          base_image: string | null
          charge_for_product: boolean | null
          created_at: string
          daily_rate: number | null
          default_price_per_day: number
          default_storage_location_id: string | null
          description: string | null
          fixed_price: number | null
          hourly_rate: number | null
          id: string
          image_url: string | null
          low_stock_threshold: number
          monthly_rate: number | null
          name: string
          pricing_method: string | null
          stock_in_service: number
          stock_total: number
          track_inventory: boolean
          updated_at: string
          variations_allowed: boolean
          weekly_rate: number | null
        }
        Insert: {
          barcode?: string | null
          base_image?: string | null
          charge_for_product?: boolean | null
          created_at?: string
          daily_rate?: number | null
          default_price_per_day: number
          default_storage_location_id?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          monthly_rate?: number | null
          name: string
          pricing_method?: string | null
          stock_in_service?: number
          stock_total?: number
          track_inventory?: boolean
          updated_at?: string
          variations_allowed?: boolean
          weekly_rate?: number | null
        }
        Update: {
          barcode?: string | null
          base_image?: string | null
          charge_for_product?: boolean | null
          created_at?: string
          daily_rate?: number | null
          default_price_per_day?: number
          default_storage_location_id?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          monthly_rate?: number | null
          name?: string
          pricing_method?: string | null
          stock_in_service?: number
          stock_total?: number
          track_inventory?: boolean
          updated_at?: string
          variations_allowed?: boolean
          weekly_rate?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_variations: {
        Row: {
          created_at: string
          id: string
          price_modifier: number
          property_id: string
          stock_in_service: number
          stock_total: number
          updated_at: string
          variation_image: string | null
          variation_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_modifier?: number
          property_id: string
          stock_in_service?: number
          stock_total?: number
          updated_at?: string
          variation_image?: string | null
          variation_name: string
        }
        Update: {
          created_at?: string
          id?: string
          price_modifier?: number
          property_id?: string
          stock_in_service?: number
          stock_total?: number
          updated_at?: string
          variation_image?: string | null
          variation_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_variations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "product_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          consumable_id: string
          created_at: string
          id: string
          line_total: number
          purchase_order_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          line_total: number
          purchase_order_id: string
          quantity: number
          unit_cost: number
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          line_total?: number
          purchase_order_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_date: string
          received_by: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          received_by?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          received_by?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qr_consumable_requests: {
        Row: {
          consumable_id: string
          created_at: string
          customer_email: string | null
          customer_message: string | null
          customer_phone: string | null
          id: string
          is_read: boolean
          photo_url: string | null
          priority: string
          processed_at: string | null
          processed_by: string | null
          quantity: number
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          consumable_id: string
          created_at?: string
          customer_email?: string | null
          customer_message?: string | null
          customer_phone?: string | null
          id?: string
          is_read?: boolean
          photo_url?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          consumable_id?: string
          created_at?: string
          customer_email?: string | null
          customer_message?: string | null
          customer_phone?: string | null
          id?: string
          is_read?: boolean
          photo_url?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_consumable_requests_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_consumable_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_consumable_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_feedback: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_message: string
          customer_phone: string | null
          feedback_type: string
          id: string
          is_read: boolean | null
          photo_url: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_message: string
          customer_phone?: string | null
          feedback_type: string
          id?: string
          is_read?: boolean | null
          photo_url?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_message?: string
          customer_phone?: string | null
          feedback_type?: string
          id?: string
          is_read?: boolean | null
          photo_url?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_feedback_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_audit_log: {
        Row: {
          action_type: string
          changed_by: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          quote_id: string
        }
        Insert: {
          action_type: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          quote_id: string
        }
        Update: {
          action_type?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_audit_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "active_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_audit_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          early_pickup_date: string | null
          early_pickup_quantity: number | null
          has_early_pickup: boolean | null
          id: string
          line_item_type: string | null
          line_total: number
          product_id: string | null
          product_name: string
          product_variation_id: string | null
          quantity: number
          quote_id: string
          rental_duration_days: number | null
          rental_end_date: string | null
          rental_start_date: string | null
          service_frequency: string | null
          service_hours: number | null
          service_id: string | null
          service_notes: string | null
          unit_price: number
          updated_at: string
          variation_name: string | null
        }
        Insert: {
          created_at?: string
          early_pickup_date?: string | null
          early_pickup_quantity?: number | null
          has_early_pickup?: boolean | null
          id?: string
          line_item_type?: string | null
          line_total: number
          product_id?: string | null
          product_name: string
          product_variation_id?: string | null
          quantity?: number
          quote_id: string
          rental_duration_days?: number | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          unit_price: number
          updated_at?: string
          variation_name?: string | null
        }
        Update: {
          created_at?: string
          early_pickup_date?: string | null
          early_pickup_quantity?: number | null
          has_early_pickup?: boolean | null
          id?: string
          line_item_type?: string | null
          line_total?: number
          product_id?: string | null
          product_name?: string
          product_variation_id?: string | null
          quantity?: number
          quote_id?: string
          rental_duration_days?: number | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          service_frequency?: string | null
          service_hours?: number | null
          service_id?: string | null
          service_notes?: string | null
          unit_price?: number
          updated_at?: string
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "active_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "routine_maintenance_services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          additional_fees: number | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          discount_type: string | null
          discount_value: number | null
          expiration_date: string | null
          id: string
          notes: string | null
          pdf_path: string | null
          quote_number: string | null
          sent_at: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          additional_fees?: number | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          pdf_path?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          additional_fees?: number | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          pdf_path?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_access_logs: {
        Row: {
          access_details: Json | null
          access_type: string
          created_at: string | null
          id: string
          report_id: string | null
          user_id: string | null
        }
        Insert: {
          access_details?: Json | null
          access_type: string
          created_at?: string | null
          id?: string
          report_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_details?: Json | null
          access_type?: string
          created_at?: string | null
          id?: string
          report_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_access_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "custom_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_analytics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
          report_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
          report_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_analytics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_distribution: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          failure_reason: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          report_id: string | null
          retry_count: number | null
          scheduled_report_id: string | null
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          failure_reason?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          report_id?: string | null
          retry_count?: number | null
          scheduled_report_id?: string | null
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          failure_reason?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          report_id?: string | null
          retry_count?: number | null
          scheduled_report_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_distribution_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_distribution_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_workflow_transitions: {
        Row: {
          from_status: string
          id: string
          metadata: Json | null
          notes: string | null
          report_id: string
          to_status: string
          transition_date: string | null
          transitioned_by: string | null
        }
        Insert: {
          from_status: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          report_id: string
          to_status: string
          transition_date?: string | null
          transitioned_by?: string | null
        }
        Update: {
          from_status?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          report_id?: string
          to_status?: string
          transition_date?: string | null
          transitioned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_workflow_transitions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_workflow_transitions_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_analytics_cache: {
        Row: {
          average_job_value: number | null
          created_at: string | null
          customer_acquisition_cost: number | null
          customer_lifetime_value: number | null
          forecast_data: Json | null
          growth_rate: number | null
          id: string
          period_end: string
          period_start: string
          period_type: string
          profit_margin: number | null
          total_jobs: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          average_job_value?: number | null
          created_at?: string | null
          customer_acquisition_cost?: number | null
          customer_lifetime_value?: number | null
          forecast_data?: Json | null
          growth_rate?: number | null
          id?: string
          period_end: string
          period_start: string
          period_type: string
          profit_margin?: number | null
          total_jobs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          average_job_value?: number | null
          created_at?: string | null
          customer_acquisition_cost?: number | null
          customer_lifetime_value?: number | null
          forecast_data?: Json | null
          growth_rate?: number | null
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          profit_margin?: number | null
          total_jobs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      routine_maintenance_services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          estimated_duration_hours: number | null
          flat_rate_cost: number | null
          frequency_recommendation: string | null
          id: string
          is_active: boolean | null
          name: string
          per_hour_cost: number | null
          per_visit_cost: number | null
          pricing_method: string
          service_code: string | null
          service_requirements: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          flat_rate_cost?: number | null
          frequency_recommendation?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          per_hour_cost?: number | null
          per_visit_cost?: number | null
          pricing_method?: string
          service_code?: string | null
          service_requirements?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          flat_rate_cost?: number | null
          frequency_recommendation?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          per_hour_cost?: number | null
          per_visit_cost?: number | null
          pricing_method?: string
          service_code?: string | null
          service_requirements?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_maintenance_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_buttons: {
        Row: {
          button_style: string
          button_text: string
          button_type: string
          button_value: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          button_style: string
          button_text: string
          button_type: string
          button_value: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          button_style?: string
          button_text?: string
          button_type?: string
          button_value?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          format: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          name: string
          next_send_at: string | null
          recipients: Json
          report_id: string | null
          schedule_config: Json
          schedule_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          format?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name: string
          next_send_at?: string | null
          recipients?: Json
          report_id?: string | null
          schedule_config?: Json
          schedule_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          format?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name?: string
          next_send_at?: string | null
          recipients?: Json
          report_id?: string | null
          schedule_config?: Json
          schedule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "custom_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_location_coordinates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_primary: boolean | null
          latitude: number
          longitude: number
          pin_color: string | null
          point_name: string
          service_location_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean | null
          latitude: number
          longitude: number
          pin_color?: string | null
          point_name: string
          service_location_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number
          longitude?: number
          pin_color?: string | null
          point_name?: string
          service_location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_location_coordinates_location"
            columns: ["service_location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reports: {
        Row: {
          created_at: string
          customer_id: string
          file_name: string
          file_path: string
          file_size: number | null
          generated_at: string
          generated_by: string | null
          id: string
          job_id: string
          report_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          job_id: string
          report_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          job_id?: string
          report_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          estimated_cost: number | null
          id: string
          internal_notes: string | null
          location_address: string | null
          preferred_time: string | null
          priority: string
          requested_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          estimated_cost?: number | null
          id?: string
          internal_notes?: string | null
          location_address?: string | null
          preferred_time?: string | null
          priority?: string
          requested_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          internal_notes?: string | null
          location_address?: string | null
          preferred_time?: string | null
          priority?: string
          requested_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          cost_amount: number | null
          cost_currency: string | null
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          from_phone: string
          id: string
          message: string
          message_type: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          status: string
          to_phone: string
          twilio_message_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_phone: string
          id?: string
          message: string
          message_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string
          to_phone: string
          twilio_message_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_phone?: string
          id?: string
          message?: string
          message_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string
          to_phone?: string
          twilio_message_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          product_variation_id: string | null
          quantity_change: number
          reason: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_variation_id?: string | null
          quantity_change: number
          reason: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_variation_id?: string | null
          quantity_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          address_type: string
          company_address_id: string | null
          created_at: string
          custom_city: string | null
          custom_state: string | null
          custom_street: string | null
          custom_street2: string | null
          custom_zip: string | null
          description: string | null
          gps_coordinates: unknown | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          address_type?: string
          company_address_id?: string | null
          created_at?: string
          custom_city?: string | null
          custom_state?: string | null
          custom_street?: string | null
          custom_street2?: string | null
          custom_zip?: string | null
          description?: string | null
          gps_coordinates?: unknown | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          address_type?: string
          company_address_id?: string | null
          created_at?: string
          custom_city?: string | null
          custom_state?: string | null
          custom_street?: string | null
          custom_street2?: string | null
          custom_zip?: string | null
          description?: string | null
          gps_coordinates?: unknown | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          color_code: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      template_field_definitions: {
        Row: {
          created_at: string | null
          field_id: string
          field_label: string
          field_order: number
          field_properties: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          template_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          field_label: string
          field_order: number
          field_properties?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          template_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          field_label?: string
          field_order?: number
          field_properties?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          template_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "template_field_definitions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_history: {
        Row: {
          customer_id: string | null
          id: string
          job_id: string | null
          report_id: string | null
          template_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          customer_id?: string | null
          id?: string
          job_id?: string | null
          report_id?: string | null
          template_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          customer_id?: string | null
          id?: string
          job_id?: string | null
          report_id?: string | null
          template_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "maintenance_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_history_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_tracking: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          template_id: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          template_id: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          template_id?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_tracking_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          change_details: Json | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          field_definitions: Json
          id: string
          is_current: boolean
          template_data: Json
          template_id: string
          usage_impact_analysis: Json | null
          version_number: number
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          change_details?: Json | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          field_definitions?: Json
          id?: string
          is_current?: boolean
          template_data: Json
          template_id: string
          usage_impact_analysis?: Json | null
          version_number: number
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          change_details?: Json | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          field_definitions?: Json
          id?: string
          is_current?: boolean
          template_data?: Json
          template_id?: string
          usage_impact_analysis?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          assignment_date: string
          created_at: string
          driver_id: string | null
          id: string
          job_id: string
          notes: string | null
          return_date: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assignment_date: string
          created_at?: string
          driver_id?: string | null
          id?: string
          job_id: string
          notes?: string | null
          return_date?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assignment_date?: string
          created_at?: string
          driver_id?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          return_date?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_capacity_configurations: {
        Row: {
          compartment_config: Json | null
          configuration_name: string
          created_at: string
          id: string
          is_active: boolean | null
          total_volume_capacity: number | null
          total_weight_capacity: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          compartment_config?: Json | null
          configuration_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          total_volume_capacity?: number | null
          total_weight_capacity?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          compartment_config?: Json | null
          configuration_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          total_volume_capacity?: number | null
          total_weight_capacity?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_compliance_documents: {
        Row: {
          created_at: string
          document_type_id: string
          expiration_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          notes: string | null
          updated_at: string
          uploaded_by: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_compliance_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_compliance_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_damage_logs: {
        Row: {
          created_at: string
          damage_type: string
          description: string
          id: string
          image_path: string | null
          reported_at: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          damage_type?: string
          description: string
          id?: string
          image_path?: string | null
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          damage_type?: string
          description?: string
          id?: string
          image_path?: string | null
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          document_name: string
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          linked_maintenance_record_id: string | null
          notes: string | null
          tags: Json | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string | null
          vehicle_id: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          document_name: string
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          linked_maintenance_record_id?: string | null
          notes?: string | null
          tags?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          vehicle_id: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          document_name?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          linked_maintenance_record_id?: string | null
          notes?: string | null
          tags?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_linked_maintenance_record_id_fkey"
            columns: ["linked_maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inspections: {
        Row: {
          checklist_data: Json
          created_at: string | null
          id: string
          inspection_date: string
          inspection_type: string
          inspector_id: string
          issues_found: string | null
          notes: string | null
          passed: boolean
          photos: Json | null
          signature_data: string | null
          vehicle_id: string
        }
        Insert: {
          checklist_data?: Json
          created_at?: string | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_id: string
          issues_found?: string | null
          notes?: string | null
          passed?: boolean
          photos?: Json | null
          signature_data?: string | null
          vehicle_id: string
        }
        Update: {
          checklist_data?: Json
          created_at?: string | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_id?: string
          issues_found?: string | null
          notes?: string | null
          passed?: boolean
          photos?: Json | null
          signature_data?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_load_capacities: {
        Row: {
          created_at: string
          id: string
          max_capacity: number
          product_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_capacity?: number
          product_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_capacity?: number
          product_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: string | null
          color: string | null
          created_at: string | null
          current_mileage: number | null
          custom_vehicle_type: string | null
          fuel_type: string | null
          gps_enabled: boolean | null
          id: string
          insurance_expiry: string | null
          last_known_location: unknown | null
          last_location_update: string | null
          license_plate: string
          maintenance_interval_miles: number | null
          make: string
          model: string
          next_maintenance_due_date: string | null
          next_maintenance_due_miles: number | null
          nickname: string | null
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          registration_expiry: string | null
          status: string
          updated_at: string | null
          vehicle_image: string | null
          vehicle_type: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          capacity?: string | null
          color?: string | null
          created_at?: string | null
          current_mileage?: number | null
          custom_vehicle_type?: string | null
          fuel_type?: string | null
          gps_enabled?: boolean | null
          id?: string
          insurance_expiry?: string | null
          last_known_location?: unknown | null
          last_location_update?: string | null
          license_plate: string
          maintenance_interval_miles?: number | null
          make: string
          model: string
          next_maintenance_due_date?: string | null
          next_maintenance_due_miles?: number | null
          nickname?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          registration_expiry?: string | null
          status?: string
          updated_at?: string | null
          vehicle_image?: string | null
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          capacity?: string | null
          color?: string | null
          created_at?: string | null
          current_mileage?: number | null
          custom_vehicle_type?: string | null
          fuel_type?: string | null
          gps_enabled?: boolean | null
          id?: string
          insurance_expiry?: string | null
          last_known_location?: unknown | null
          last_location_update?: string | null
          license_plate?: string
          maintenance_interval_miles?: number | null
          make?: string
          model?: string
          next_maintenance_due_date?: string | null
          next_maintenance_due_miles?: number | null
          nickname?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          registration_expiry?: string | null
          status?: string
          updated_at?: string | null
          vehicle_image?: string | null
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      active_quotes: {
        Row: {
          additional_fees: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          discount_type: string | null
          discount_value: number | null
          expiration_date: string | null
          id: string | null
          notes: string | null
          pdf_path: string | null
          quote_number: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          additional_fees?: number | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiration_date?: string | null
          id?: string | null
          notes?: string | null
          pdf_path?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_fees?: number | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiration_date?: string | null
          id?: string | null
          notes?: string | null
          pdf_path?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_customer_note: {
        Args: {
          customer_uuid: string
          note_content: string
          is_important_flag?: boolean
          clerk_user_id?: string
        }
        Returns: string
      }
      add_job_note: {
        Args: {
          job_uuid: string
          driver_uuid: string
          note_content: string
          note_category?: string
        }
        Returns: string
      }
      adjust_master_stock: {
        Args: {
          product_uuid: string
          quantity_change: number
          reason: string
          notes?: string
        }
        Returns: boolean
      }
      adjust_stock_for_job_completion: {
        Args: { job_uuid: string; job_type_param: string }
        Returns: boolean
      }
      admin_create_user: {
        Args: {
          user_email: string
          user_password: string
          user_first_name: string
          user_last_name: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      auto_fix_storage_location_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_populate_location_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      batch_geocode_existing_locations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calculate_daily_vehicle_loads: {
        Args: { target_date: string }
        Returns: undefined
      }
      calculate_fleet_efficiency_trends: {
        Args: { start_date?: string; end_date?: string }
        Returns: Json
      }
      calculate_report_metrics: {
        Args:
          | Record<PropertyKey, never>
          | { start_date?: string; end_date?: string }
        Returns: Json
      }
      calculate_revenue_analytics: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      can_delete_user: {
        Args: { user_uuid: string }
        Returns: Json
      }
      check_unit_availability: {
        Args: { unit_id: string; start_date: string; end_date: string }
        Returns: boolean
      }
      cleanup_duplicate_service_locations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clerk_user_has_role: {
        Args: { clerk_user_id: string; required_role: string }
        Returns: boolean
      }
      clerk_user_has_role_simple: {
        Args: { clerk_user_id: string; required_role: string }
        Returns: boolean
      }
      clerk_user_is_admin: {
        Args: { clerk_user_id: string }
        Returns: boolean
      }
      create_default_service_locations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_template_version: {
        Args: {
          template_uuid: string
          new_template_data: Json
          new_field_definitions: Json
          change_summary_text?: string
          change_details_data?: Json
          creator_id?: string
        }
        Returns: string
      }
      dismiss_overdue_invoice: {
        Args: { invoice_uuid: string; dismiss_reason?: string }
        Returns: boolean
      }
      ensure_user_registered: {
        Args:
          | {
              clerk_user_id: string
              user_email?: string
              user_first_name?: string
              user_last_name?: string
            }
          | {
              clerk_user_id_param: string
              first_name_param?: string
              last_name_param?: string
              email_param?: string
              role_param?: string
            }
        Returns: string
      }
      export_maintenance_data: {
        Args: {
          start_date?: string
          end_date?: string
          vehicle_ids?: string[]
          export_format?: string
        }
        Returns: Json
      }
      fix_orphaned_equipment_assignments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_customer_portal_token: {
        Args: { customer_uuid: string }
        Returns: string
      }
      generate_daily_compliance_report: {
        Args: { target_date?: string }
        Returns: Json
      }
      generate_enhanced_portal_token: {
        Args: {
          customer_uuid: string
          expiration_hours?: number
          one_time_use?: boolean
          features?: string
        }
        Returns: string
      }
      generate_invoice_from_quote: {
        Args: { quote_uuid: string }
        Returns: string
      }
      generate_item_code: {
        Args: { product_name: string; sequence_number: number }
        Returns: string
      }
      generate_jobs_from_quote: {
        Args: { quote_uuid: string }
        Returns: Json
      }
      generate_report_number: {
        Args: { template_type: string }
        Returns: string
      }
      generate_storage_location_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_units: {
        Args: { product_type_id: string; start_date: string; end_date: string }
        Returns: {
          item_id: string
          item_code: string
          status: string
          location: unknown
        }[]
      }
      get_available_vehicles: {
        Args: { start_date: string; end_date: string }
        Returns: {
          vehicle_id: string
          license_plate: string
          vehicle_type: string
          location: unknown
        }[]
      }
      get_compliance_notification_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_comprehensive_stock_breakdown: {
        Args: { product_uuid?: string }
        Returns: {
          product_id: string
          product_name: string
          master_stock: number
          individual_items_count: number
          individual_available: number
          individual_assigned: number
          bulk_pool: number
          reserved_count: number
          physically_available: number
          maintenance_count: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_simple: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_categories: {
        Args: { customer_uuid: string }
        Returns: {
          category_name: string
          point_count: number
        }[]
      }
      get_customer_notes_with_users: {
        Args: { customer_uuid: string }
        Returns: {
          id: string
          customer_id: string
          note_text: string
          is_important: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
          user_first_name: string
          user_last_name: string
          user_email: string
        }[]
      }
      get_customer_type_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_type: string
          total_count: number
          email_count: number
          sms_count: number
          both_count: number
        }[]
      }
      get_drivers_with_hours: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
          working_hours: Json
        }[]
      }
      get_fuel_metrics: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      get_inventory_breakdown: {
        Args: { product_type_id: string }
        Returns: Json
      }
      get_invoice_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_job_notes: {
        Args: { job_uuid: string }
        Returns: {
          id: string
          job_id: string
          driver_id: string
          note_text: string
          note_type: string
          created_at: string
        }[]
      }
      get_maintenance_analytics: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_maintenance_kpis: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_maintenance_metrics: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      get_next_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_job_number: {
        Args: { job_type_param: string }
        Returns: string
      }
      get_next_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_template_version: {
        Args: { template_uuid: string }
        Returns: number
      }
      get_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          invoice_number: string
          customer_id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          amount: number
          due_date: string
          days_overdue: number
          created_at: string
        }[]
      }
      get_overdue_invoices_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_product_availability_enhanced: {
        Args: {
          product_type_id: string
          start_date: string
          end_date: string
          filter_attributes?: Json
        }
        Returns: Json
      }
      get_quote_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_recent_fuel_logs: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          log_date: string
          vehicle_license: string
          driver_name: string
          gallons_purchased: number
          cost_per_gallon: number
          total_cost: number
          fuel_station: string
          odometer_reading: number
        }[]
      }
      get_system_wide_availability: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_technician_availability: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_template_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_template_statistics: {
        Args: { template_uuid: string }
        Returns: Json
      }
      get_unified_product_stock: {
        Args: { product_uuid: string }
        Returns: Json
      }
      get_user_role_by_clerk_id: {
        Args: { clerk_user_id: string }
        Returns: string
      }
      get_user_role_by_clerk_id_simple: {
        Args: { clerk_user_id: string }
        Returns: string
      }
      get_vehicle_efficiency: {
        Args: { start_date: string; end_date: string }
        Returns: {
          vehicle_id: string
          license_plate: string
          total_gallons: number
          total_miles: number
          mpg: number
          total_cost: number
          cost_per_mile: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_job_status_change: {
        Args: {
          job_uuid: string
          changed_by_uuid: string
          new_status_value: string
          lat?: number
          lng?: number
          change_notes?: string
        }
        Returns: string
      }
      migrate_consumables_to_default_location: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_customer_zip_codes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_revenue_analytics_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reserve_equipment_for_job: {
        Args: {
          job_uuid: string
          product_uuid: string
          reserve_quantity: number
          assignment_date: string
          return_date?: string
        }
        Returns: Json
      }
      reserve_specific_item_for_job: {
        Args: {
          job_uuid: string
          item_uuid: string
          assignment_date: string
          return_date?: string
        }
        Returns: Json
      }
      rollback_template_version: {
        Args: {
          template_uuid: string
          target_version_number: number
          rollback_reason?: string
        }
        Returns: boolean
      }
      soft_delete_quote: {
        Args: { quote_uuid: string }
        Returns: boolean
      }
      track_template_usage: {
        Args:
          | { template_uuid: string }
          | {
              template_uuid: string
              user_uuid?: string
              report_uuid?: string
              customer_uuid?: string
              job_uuid?: string
            }
        Returns: undefined
      }
      transition_report_status: {
        Args: {
          report_uuid: string
          new_status: string
          user_uuid?: string
          transition_notes?: string
        }
        Returns: boolean
      }
      update_customer_note: {
        Args: {
          note_uuid: string
          note_content: string
          is_important_flag?: boolean
          clerk_user_id?: string
        }
        Returns: boolean
      }
      update_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_role_safe: {
        Args: { required_role: string }
        Returns: boolean
      }
      user_has_role_simple: {
        Args: { required_role: string }
        Returns: boolean
      }
      validate_customer_portal_token: {
        Args: { token_value: string }
        Returns: {
          customer_id: string
          customer_name: string
          customer_email: string
        }[]
      }
      validate_storage_location_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "dispatcher" | "driver" | "customer" | "admin"
      consumable_category:
        | "sanitizer"
        | "deodorizer"
        | "paper_products"
        | "cleaning_supplies"
        | "chemicals"
        | "hardware"
        | "tools"
        | "other"
      customer_type:
        | "events_festivals"
        | "sports_recreation"
        | "municipal_government"
        | "commercial"
        | "construction"
        | "emergency_disaster_relief"
        | "private_events_weddings"
        | "not_selected"
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
      app_role: ["owner", "dispatcher", "driver", "customer", "admin"],
      consumable_category: [
        "sanitizer",
        "deodorizer",
        "paper_products",
        "cleaning_supplies",
        "chemicals",
        "hardware",
        "tools",
        "other",
      ],
      customer_type: [
        "events_festivals",
        "sports_recreation",
        "municipal_government",
        "commercial",
        "construction",
        "emergency_disaster_relief",
        "private_events_weddings",
        "not_selected",
      ],
    },
  },
} as const
