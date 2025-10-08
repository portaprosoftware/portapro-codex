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
        Relationships: []
      }
      campaign_drafts: {
        Row: {
          campaign_data: Json
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          campaign_data?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          campaign_data?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certification_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean
          name: string
          updated_at: string
          valid_months: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          name: string
          updated_at?: string
          valid_months?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          name?: string
          updated_at?: string
          valid_months?: number | null
        }
        Relationships: []
      }
      communication_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          email_content: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_system: boolean | null
          name: string
          sms_content: string | null
          source: string | null
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          email_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_system?: boolean | null
          name: string
          sms_content?: string | null
          source?: string | null
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          email_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_system?: boolean | null
          name?: string
          sms_content?: string | null
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
          consumable_categories: Json
          created_at: string | null
          default_logo_in_marketing: boolean | null
          default_payment_terms_days: number | null
          default_quote_expiration_days: number | null
          default_rental_period_days: number | null
          default_spill_kit_contents: Json
          delivery_prefix: string | null
          due_soon_window_days: number
          enable_sanitation_compliance: boolean
          enable_transport_spill_compliance: boolean
          flat_tax_rate: number | null
          id: string
          invoice_number_prefix: string | null
          item_code_categories: Json | null
          next_cleaning_number: number | null
          next_delivery_number: number | null
          next_invoice_number: number | null
          next_item_numbers: Json | null
          next_pickup_number: number | null
          next_quote_number: number | null
          next_return_number: number | null
          next_service_number: number | null
          next_survey_number: number | null
          pickup_prefix: string | null
          qr_feedback_email: string | null
          qr_feedback_notifications_enabled: boolean | null
          quote_number_prefix: string | null
          return_prefix: string | null
          service_prefix: string | null
          state_tax_rates: Json | null
          support_email: string | null
          survey_prefix: string | null
          tax_enabled: boolean | null
          tax_method: string | null
          updated_at: string | null
          zip_tax_overrides: Json | null
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
          consumable_categories?: Json
          created_at?: string | null
          default_logo_in_marketing?: boolean | null
          default_payment_terms_days?: number | null
          default_quote_expiration_days?: number | null
          default_rental_period_days?: number | null
          default_spill_kit_contents?: Json
          delivery_prefix?: string | null
          due_soon_window_days?: number
          enable_sanitation_compliance?: boolean
          enable_transport_spill_compliance?: boolean
          flat_tax_rate?: number | null
          id?: string
          invoice_number_prefix?: string | null
          item_code_categories?: Json | null
          next_cleaning_number?: number | null
          next_delivery_number?: number | null
          next_invoice_number?: number | null
          next_item_numbers?: Json | null
          next_pickup_number?: number | null
          next_quote_number?: number | null
          next_return_number?: number | null
          next_service_number?: number | null
          next_survey_number?: number | null
          pickup_prefix?: string | null
          qr_feedback_email?: string | null
          qr_feedback_notifications_enabled?: boolean | null
          quote_number_prefix?: string | null
          return_prefix?: string | null
          service_prefix?: string | null
          state_tax_rates?: Json | null
          support_email?: string | null
          survey_prefix?: string | null
          tax_enabled?: boolean | null
          tax_method?: string | null
          updated_at?: string | null
          zip_tax_overrides?: Json | null
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
          consumable_categories?: Json
          created_at?: string | null
          default_logo_in_marketing?: boolean | null
          default_payment_terms_days?: number | null
          default_quote_expiration_days?: number | null
          default_rental_period_days?: number | null
          default_spill_kit_contents?: Json
          delivery_prefix?: string | null
          due_soon_window_days?: number
          enable_sanitation_compliance?: boolean
          enable_transport_spill_compliance?: boolean
          flat_tax_rate?: number | null
          id?: string
          invoice_number_prefix?: string | null
          item_code_categories?: Json | null
          next_cleaning_number?: number | null
          next_delivery_number?: number | null
          next_invoice_number?: number | null
          next_item_numbers?: Json | null
          next_pickup_number?: number | null
          next_quote_number?: number | null
          next_return_number?: number | null
          next_service_number?: number | null
          next_survey_number?: number | null
          pickup_prefix?: string | null
          qr_feedback_email?: string | null
          qr_feedback_notifications_enabled?: boolean | null
          quote_number_prefix?: string | null
          return_prefix?: string | null
          service_prefix?: string | null
          state_tax_rates?: Json | null
          support_email?: string | null
          survey_prefix?: string | null
          tax_enabled?: boolean | null
          tax_method?: string | null
          updated_at?: string | null
          zip_tax_overrides?: Json | null
        }
        Relationships: []
      }
      compliance_document_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      configurable_spill_types: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subcategory?: string | null
          updated_at?: string | null
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
        Relationships: []
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
          low_stock_threshold: number
          quantity: number
          storage_location_id: string
          updated_at: string
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          low_stock_threshold?: number
          quantity?: number
          storage_location_id: string
          updated_at?: string
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          low_stock_threshold?: number
          quantity?: number
          storage_location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumable_location_stock_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_location_stock_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_location_stock_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_location_stock_storage_location_id_fkey"
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
            foreignKeyName: "fk_consumable_stock_adjustments_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "fk_consumable_stock_adjustments_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "fk_consumable_stock_adjustments_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
        ]
      }
      consumable_stock_ledger: {
        Row: {
          consumable_id: string
          created_at: string
          id: string
          job_id: string | null
          notes: string | null
          occurred_at: string
          qty: number
          storage_location_id: string | null
          type: string
          unit_cost: number | null
          vehicle_id: string | null
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          occurred_at?: string
          qty: number
          storage_location_id?: string | null
          type: string
          unit_cost?: number | null
          vehicle_id?: string | null
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          occurred_at?: string
          qty?: number
          storage_location_id?: string | null
          type?: string
          unit_cost?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      consumables: {
        Row: {
          base_unit: string
          billable_rule: string | null
          brand: string | null
          case_cost: number | null
          case_quantity: number | null
          category: string
          cost_per_use: number | null
          created_at: string
          created_by: string | null
          default_storage_location_id: string | null
          description: string | null
          dilution_ratio: string | null
          examples: string | null
          expiration_date: string | null
          fragrance_color_grade: string | null
          ghs_hazard_flags: Json
          gtin_barcode: string | null
          id: string
          is_active: boolean
          lead_time_days: number
          location_stock: Json | null
          lot_batch_number: string | null
          model_number: string | null
          mpn: string | null
          name: string
          notes: string | null
          on_hand_qty: number
          reorder_threshold: number
          sds_link: string | null
          sku: string | null
          supplier_info: Json | null
          supplier_item_id: string | null
          target_days_supply: number
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          base_unit?: string
          billable_rule?: string | null
          brand?: string | null
          case_cost?: number | null
          case_quantity?: number | null
          category: string
          cost_per_use?: number | null
          created_at?: string
          created_by?: string | null
          default_storage_location_id?: string | null
          description?: string | null
          dilution_ratio?: string | null
          examples?: string | null
          expiration_date?: string | null
          fragrance_color_grade?: string | null
          ghs_hazard_flags?: Json
          gtin_barcode?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number
          location_stock?: Json | null
          lot_batch_number?: string | null
          model_number?: string | null
          mpn?: string | null
          name: string
          notes?: string | null
          on_hand_qty?: number
          reorder_threshold?: number
          sds_link?: string | null
          sku?: string | null
          supplier_info?: Json | null
          supplier_item_id?: string | null
          target_days_supply?: number
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          base_unit?: string
          billable_rule?: string | null
          brand?: string | null
          case_cost?: number | null
          case_quantity?: number | null
          category?: string
          cost_per_use?: number | null
          created_at?: string
          created_by?: string | null
          default_storage_location_id?: string | null
          description?: string | null
          dilution_ratio?: string | null
          examples?: string | null
          expiration_date?: string | null
          fragrance_color_grade?: string | null
          ghs_hazard_flags?: Json
          gtin_barcode?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number
          location_stock?: Json | null
          lot_batch_number?: string | null
          model_number?: string | null
          mpn?: string | null
          name?: string
          notes?: string | null
          on_hand_qty?: number
          reorder_threshold?: number
          sds_link?: string | null
          sku?: string | null
          supplier_info?: Json | null
          supplier_item_id?: string | null
          target_days_supply?: number
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      customer_contracts: {
        Row: {
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          created_at: string | null
          customer_id: string
          document_category: string | null
          document_name: string
          document_type: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id: string
          document_category?: string | null
          document_name: string
          document_type?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id?: string
          document_category?: string | null
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contracts_customer_id_fkey"
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
        Relationships: []
      }
      customer_map_pins: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          label: string
          latitude: number
          longitude: number
          notes: string | null
          pin_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          label: string
          latitude: number
          longitude: number
          notes?: string | null
          pin_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          label?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          pin_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_map_pins_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          title: string | null
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
          title?: string | null
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
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: []
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
          geocoding_attempted_at: string | null
          geocoding_status: string | null
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
          geocoding_attempted_at?: string | null
          geocoding_status?: string | null
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
          geocoding_attempted_at?: string | null
          geocoding_status?: string | null
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
        Relationships: []
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
          tax_rate_override: number | null
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
          tax_rate_override?: number | null
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
          tax_rate_override?: number | null
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
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
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
      decon_logs: {
        Row: {
          company_id: string | null
          created_at: string
          decon_methods: string[] | null
          follow_up_required: boolean | null
          id: string
          incident_id: string
          inspector_clerk_id: string | null
          inspector_role: string | null
          inspector_signature: string | null
          location_type: string | null
          notes: string | null
          performed_at: string
          performed_by_clerk: string | null
          photos: string[]
          post_inspection_status: string | null
          ppe_compliance_status: boolean | null
          ppe_items: string[] | null
          updated_at: string
          vehicle_areas: string[] | null
          vehicle_id: string | null
          verification_by_clerk: string | null
          verification_timestamp: string | null
          weather_conditions: string | null
          weather_details: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          decon_methods?: string[] | null
          follow_up_required?: boolean | null
          id?: string
          incident_id: string
          inspector_clerk_id?: string | null
          inspector_role?: string | null
          inspector_signature?: string | null
          location_type?: string | null
          notes?: string | null
          performed_at?: string
          performed_by_clerk?: string | null
          photos?: string[]
          post_inspection_status?: string | null
          ppe_compliance_status?: boolean | null
          ppe_items?: string[] | null
          updated_at?: string
          vehicle_areas?: string[] | null
          vehicle_id?: string | null
          verification_by_clerk?: string | null
          verification_timestamp?: string | null
          weather_conditions?: string | null
          weather_details?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          decon_methods?: string[] | null
          follow_up_required?: boolean | null
          id?: string
          incident_id?: string
          inspector_clerk_id?: string | null
          inspector_role?: string | null
          inspector_signature?: string | null
          location_type?: string | null
          notes?: string | null
          performed_at?: string
          performed_by_clerk?: string | null
          photos?: string[]
          post_inspection_status?: string | null
          ppe_compliance_status?: boolean | null
          ppe_items?: string[] | null
          updated_at?: string
          vehicle_areas?: string[] | null
          vehicle_id?: string | null
          verification_by_clerk?: string | null
          verification_timestamp?: string | null
          weather_conditions?: string | null
          weather_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decon_logs_incident_fk"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "spill_incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decon_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "decon_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_audit_log: {
        Row: {
          action_type: string
          change_reason: string | null
          changed_by: string
          created_at: string | null
          delivery_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action_type: string
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          delivery_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action_type?: string
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          delivery_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_audit_log_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "fuel_tank_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      disposal_manifests: {
        Row: {
          created_at: string
          disposal_date: string
          disposal_fee: number | null
          driver_id: string
          facility_address: string
          facility_contact_person: string | null
          facility_name: string
          facility_permit_number: string | null
          facility_phone: string | null
          id: string
          manifest_document_url: string | null
          manifest_number: string
          receipt_document_url: string | null
          receipt_number: string | null
          special_handling_notes: string | null
          unit_of_measure: string
          updated_at: string
          vehicle_id: string
          vehicle_odometer: number | null
          volume_disposed: number
          waste_source_description: string | null
          waste_type: string
        }
        Insert: {
          created_at?: string
          disposal_date: string
          disposal_fee?: number | null
          driver_id: string
          facility_address: string
          facility_contact_person?: string | null
          facility_name: string
          facility_permit_number?: string | null
          facility_phone?: string | null
          id?: string
          manifest_document_url?: string | null
          manifest_number: string
          receipt_document_url?: string | null
          receipt_number?: string | null
          special_handling_notes?: string | null
          unit_of_measure?: string
          updated_at?: string
          vehicle_id: string
          vehicle_odometer?: number | null
          volume_disposed: number
          waste_source_description?: string | null
          waste_type?: string
        }
        Update: {
          created_at?: string
          disposal_date?: string
          disposal_fee?: number | null
          driver_id?: string
          facility_address?: string
          facility_contact_person?: string | null
          facility_name?: string
          facility_permit_number?: string | null
          facility_phone?: string | null
          id?: string
          manifest_document_url?: string | null
          manifest_number?: string
          receipt_document_url?: string | null
          receipt_number?: string | null
          special_handling_notes?: string | null
          unit_of_measure?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_odometer?: number | null
          volume_disposed?: number
          waste_source_description?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disposal_manifests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "disposal_manifests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          color: string
          created_at: string | null
          custom_fields_schema: Json | null
          description: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          parent_group: string | null
          reminder_days_before: number | null
          requires_expiration: boolean | null
        }
        Insert: {
          color: string
          created_at?: string | null
          custom_fields_schema?: Json | null
          description?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          parent_group?: string | null
          reminder_days_before?: number | null
          requires_expiration?: boolean | null
        }
        Update: {
          color?: string
          created_at?: string | null
          custom_fields_schema?: Json | null
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parent_group?: string | null
          reminder_days_before?: number | null
          requires_expiration?: boolean | null
        }
        Relationships: []
      }
      document_notification_settings: {
        Row: {
          created_at: string | null
          dashboard_alerts: boolean | null
          email_notifications: boolean | null
          id: string
          notification_emails: string[] | null
          notification_phones: string[] | null
          sms_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dashboard_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          notification_emails?: string[] | null
          notification_phones?: string[] | null
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dashboard_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          notification_emails?: string[] | null
          notification_phones?: string[] | null
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          driver_id: string
          id: string
          ip_address: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          driver_id: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          driver_id?: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_activity_log_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_credentials: {
        Row: {
          cdl_class: string | null
          created_at: string
          driver_id: string
          id: string
          license_category: string | null
          license_class: string | null
          license_endorsements: string[] | null
          license_expiry_date: string | null
          license_image_url: string | null
          license_number: string | null
          license_restrictions: string[] | null
          license_state: string | null
          medical_card_expiry_date: string | null
          medical_card_image_url: string | null
          medical_card_reference: string | null
          notes: string | null
          operating_scope: string | null
          updated_at: string
        }
        Insert: {
          cdl_class?: string | null
          created_at?: string
          driver_id: string
          id?: string
          license_category?: string | null
          license_class?: string | null
          license_endorsements?: string[] | null
          license_expiry_date?: string | null
          license_image_url?: string | null
          license_number?: string | null
          license_restrictions?: string[] | null
          license_state?: string | null
          medical_card_expiry_date?: string | null
          medical_card_image_url?: string | null
          medical_card_reference?: string | null
          notes?: string | null
          operating_scope?: string | null
          updated_at?: string
        }
        Update: {
          cdl_class?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          license_category?: string | null
          license_class?: string | null
          license_endorsements?: string[] | null
          license_expiry_date?: string | null
          license_image_url?: string | null
          license_number?: string | null
          license_restrictions?: string[] | null
          license_state?: string | null
          medical_card_expiry_date?: string | null
          medical_card_image_url?: string | null
          medical_card_reference?: string | null
          notes?: string | null
          operating_scope?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_credentials_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_devices: {
        Row: {
          app_access_connected: boolean | null
          app_last_login: string | null
          created_at: string
          driver_id: string
          driver_tag_id: string | null
          id: string
          telematics_provider: string | null
          updated_at: string
        }
        Insert: {
          app_access_connected?: boolean | null
          app_last_login?: string | null
          created_at?: string
          driver_id: string
          driver_tag_id?: string | null
          id?: string
          telematics_provider?: string | null
          updated_at?: string
        }
        Update: {
          app_access_connected?: boolean | null
          app_last_login?: string | null
          created_at?: string
          driver_id?: string
          driver_tag_id?: string | null
          id?: string
          telematics_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_devices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          driver_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          updated_at: string
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          driver_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          driver_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_equipment_qualifications: {
        Row: {
          certificate_url: string | null
          created_at: string
          driver_id: string
          equipment_type: string
          id: string
          qualification_expires: string | null
          qualified_date: string | null
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          driver_id: string
          equipment_type: string
          id?: string
          qualification_expires?: string | null
          qualified_date?: string | null
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          driver_id?: string
          equipment_type?: string
          id?: string
          qualification_expires?: string | null
          qualified_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_equipment_qualifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_ppe_info: {
        Row: {
          boot_size: string | null
          driver_id: string
          glove_size: string | null
          hard_hat_size: string | null
          id: string
          updated_at: string
          vest_size: string | null
        }
        Insert: {
          boot_size?: string | null
          driver_id: string
          glove_size?: string | null
          hard_hat_size?: string | null
          id?: string
          updated_at?: string
          vest_size?: string | null
        }
        Update: {
          boot_size?: string | null
          driver_id?: string
          glove_size?: string | null
          hard_hat_size?: string | null
          id?: string
          updated_at?: string
          vest_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_ppe_info_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_shifts: {
        Row: {
          created_at: string
          driver_clerk_id: string
          end_time: string
          id: string
          notes: string | null
          shift_date: string
          start_time: string
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_clerk_id: string
          end_time: string
          id?: string
          notes?: string | null
          shift_date: string
          start_time: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_clerk_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          shift_date?: string
          start_time?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_time_off_requests: {
        Row: {
          attachment_url: string | null
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
          attachment_url?: string | null
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
          attachment_url?: string | null
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
            foreignKeyName: "fk_driver_time_off_requests_driver_id"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_training_records: {
        Row: {
          certificate_url: string | null
          created_at: string
          driver_id: string
          id: string
          instructor_name: string | null
          last_completed: string | null
          next_due: string | null
          notes: string | null
          training_type: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          driver_id: string
          id?: string
          instructor_name?: string | null
          last_completed?: string | null
          next_due?: string | null
          notes?: string | null
          training_type: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          instructor_name?: string | null
          last_completed?: string | null
          next_due?: string | null
          notes?: string | null
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_training_records_driver_id_fkey"
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
        Relationships: []
      }
      dvir_defects: {
        Row: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          closed_at: string | null
          closed_by: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          dvir_id: string
          id: string
          item_key: string
          notes: string | null
          photos: string[] | null
          severity: Database["public"]["Enums"]["defect_severity"]
          status: Database["public"]["Enums"]["defect_status"]
          work_order_id: string | null
        }
        Insert: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          dvir_id: string
          id?: string
          item_key: string
          notes?: string | null
          photos?: string[] | null
          severity: Database["public"]["Enums"]["defect_severity"]
          status?: Database["public"]["Enums"]["defect_status"]
          work_order_id?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: Database["public"]["Enums"]["dvir_asset_type"]
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          dvir_id?: string
          id?: string
          item_key?: string
          notes?: string | null
          photos?: string[] | null
          severity?: Database["public"]["Enums"]["defect_severity"]
          status?: Database["public"]["Enums"]["defect_status"]
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dvir_defects_dvir_id_fkey"
            columns: ["dvir_id"]
            isOneToOne: false
            referencedRelation: "dvir_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      dvir_reports: {
        Row: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          company_id: string | null
          created_at: string
          created_by: string | null
          defects_count: number
          driver_id: string | null
          engine_hours: number | null
          id: string
          items: Json
          location_gps: unknown | null
          major_defect_present: boolean
          odometer_miles: number | null
          out_of_service_flag: boolean
          rejected_reason: string | null
          status: Database["public"]["Enums"]["dvir_status"]
          submitted_at: string | null
          type: Database["public"]["Enums"]["dvir_report_type"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          defects_count?: number
          driver_id?: string | null
          engine_hours?: number | null
          id?: string
          items?: Json
          location_gps?: unknown | null
          major_defect_present?: boolean
          odometer_miles?: number | null
          out_of_service_flag?: boolean
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["dvir_status"]
          submitted_at?: string | null
          type: Database["public"]["Enums"]["dvir_report_type"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: Database["public"]["Enums"]["dvir_asset_type"]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          defects_count?: number
          driver_id?: string | null
          engine_hours?: number | null
          id?: string
          items?: Json
          location_gps?: unknown | null
          major_defect_present?: boolean
          odometer_miles?: number | null
          out_of_service_flag?: boolean
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["dvir_status"]
          submitted_at?: string | null
          type?: Database["public"]["Enums"]["dvir_report_type"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      employee_certifications: {
        Row: {
          certificate_url: string | null
          certification_type_id: string
          completed_on: string
          created_at: string
          driver_clerk_id: string
          expires_on: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          certification_type_id: string
          completed_on: string
          created_at?: string
          driver_clerk_id: string
          expires_on?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          certification_type_id?: string
          completed_on?: string
          created_at?: string
          driver_clerk_id?: string
          expires_on?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
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
            foreignKeyName: "fk_equipment_assignments_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_assignments_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_assignments_product_item_id"
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
      filter_preset_usage: {
        Row: {
          filter_modifications: Json | null
          id: string
          preset_id: string | null
          results_count: number | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          filter_modifications?: Json | null
          id?: string
          preset_id?: string | null
          results_count?: number | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          filter_modifications?: Json | null
          id?: string
          preset_id?: string | null
          results_count?: number | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_preset_usage_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "filter_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_presets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter_data: Json
          id: string
          is_public: boolean
          last_used_at: string | null
          name: string
          preset_type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_data?: Json
          id?: string
          is_public?: boolean
          last_used_at?: string | null
          name: string
          preset_type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_data?: Json
          id?: string
          is_public?: boolean
          last_used_at?: string | null
          name?: string
          preset_type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      fleet_costs: {
        Row: {
          amount: number
          asset_id: string
          asset_type: string
          cost_category: string | null
          cost_type: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          engine_hours: number | null
          id: string
          odometer: number | null
          receipt_url: string | null
          reference_id: string | null
          reference_type: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          asset_id: string
          asset_type: string
          cost_category?: string | null
          cost_type: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          engine_hours?: number | null
          id?: string
          odometer?: number | null
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string
          asset_type?: string
          cost_category?: string | null
          cost_type?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          engine_hours?: number | null
          id?: string
          odometer?: number | null
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string | null
          vendor?: string | null
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
          fuel_source: Database["public"]["Enums"]["fuel_source"]
          fuel_station: string | null
          fuel_station_id: string | null
          fuel_tank_id: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          gallons_purchased: number
          id: string
          log_date: string
          mobile_vendor_id: string | null
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
          fuel_source?: Database["public"]["Enums"]["fuel_source"]
          fuel_station?: string | null
          fuel_station_id?: string | null
          fuel_tank_id?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          gallons_purchased: number
          id?: string
          log_date?: string
          mobile_vendor_id?: string | null
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
          fuel_source?: Database["public"]["Enums"]["fuel_source"]
          fuel_station?: string | null
          fuel_station_id?: string | null
          fuel_tank_id?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          gallons_purchased?: number
          id?: string
          log_date?: string
          mobile_vendor_id?: string | null
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
            foreignKeyName: "fuel_logs_fuel_station_id_fkey"
            columns: ["fuel_station_id"]
            isOneToOne: false
            referencedRelation: "fuel_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_fuel_tank_id_fkey"
            columns: ["fuel_tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_mobile_vendor_id_fkey"
            columns: ["mobile_vendor_id"]
            isOneToOne: false
            referencedRelation: "expiring_vendor_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_mobile_vendor_id_fkey"
            columns: ["mobile_vendor_id"]
            isOneToOne: false
            referencedRelation: "mobile_fuel_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_mobile_vendor_id_fkey"
            columns: ["mobile_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
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
      fuel_management_settings: {
        Row: {
          auto_calculate_cost_per_mile: boolean
          auto_calculate_mpg: boolean
          auto_flag_high_consumption: boolean
          auto_flag_price_spikes: boolean
          auto_update_tank_levels: boolean
          created_at: string
          default_fuel_source: string | null
          email_notifications: boolean
          id: string
          mobile_service_enabled: boolean
          notification_email: string | null
          notification_frequency: string | null
          notification_phone: string | null
          notifications_enabled: boolean
          price_spike_threshold_percent: number
          retail_enabled: boolean
          sms_notifications: boolean
          spcc_compliance_enabled: boolean
          spcc_tank_threshold_gallons: number
          tank_critical_threshold_percent: number
          tank_low_threshold_percent: number
          unusual_consumption_threshold_percent: number
          updated_at: string
          variance_tolerance_percent: number
          yard_tank_enabled: boolean
        }
        Insert: {
          auto_calculate_cost_per_mile?: boolean
          auto_calculate_mpg?: boolean
          auto_flag_high_consumption?: boolean
          auto_flag_price_spikes?: boolean
          auto_update_tank_levels?: boolean
          created_at?: string
          default_fuel_source?: string | null
          email_notifications?: boolean
          id?: string
          mobile_service_enabled?: boolean
          notification_email?: string | null
          notification_frequency?: string | null
          notification_phone?: string | null
          notifications_enabled?: boolean
          price_spike_threshold_percent?: number
          retail_enabled?: boolean
          sms_notifications?: boolean
          spcc_compliance_enabled?: boolean
          spcc_tank_threshold_gallons?: number
          tank_critical_threshold_percent?: number
          tank_low_threshold_percent?: number
          unusual_consumption_threshold_percent?: number
          updated_at?: string
          variance_tolerance_percent?: number
          yard_tank_enabled?: boolean
        }
        Update: {
          auto_calculate_cost_per_mile?: boolean
          auto_calculate_mpg?: boolean
          auto_flag_high_consumption?: boolean
          auto_flag_price_spikes?: boolean
          auto_update_tank_levels?: boolean
          created_at?: string
          default_fuel_source?: string | null
          email_notifications?: boolean
          id?: string
          mobile_service_enabled?: boolean
          notification_email?: string | null
          notification_frequency?: string | null
          notification_phone?: string | null
          notifications_enabled?: boolean
          price_spike_threshold_percent?: number
          retail_enabled?: boolean
          sms_notifications?: boolean
          spcc_compliance_enabled?: boolean
          spcc_tank_threshold_gallons?: number
          tank_critical_threshold_percent?: number
          tank_low_threshold_percent?: number
          unusual_consumption_threshold_percent?: number
          updated_at?: string
          variance_tolerance_percent?: number
          yard_tank_enabled?: boolean
        }
        Relationships: []
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
      fuel_suppliers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          payment_terms: string | null
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fuel_tank_deliveries: {
        Row: {
          additive_notes: string | null
          after_hours_delivery: boolean | null
          blocked_reason: string | null
          bol_ticket_number: string | null
          calculated_variance: number | null
          cost_per_gallon: number | null
          created_at: string
          delivery_date: string
          delivery_fee: number | null
          delivery_time: string | null
          dip_chart_url: string | null
          driver_name: string | null
          entered_by: string | null
          excise_tax: number | null
          fuel_grade: string | null
          gallons_delivered: number
          gross_gallons: number | null
          hazmat_fee: number | null
          id: string
          invoice_number: string | null
          locked_at: string | null
          locked_by: string | null
          locked_to_ledger: boolean | null
          notes: string | null
          other_fees: Json | null
          partial_fill_blocked: boolean | null
          payment_method: string | null
          payment_terms: string | null
          post_delivery_stick_reading: number | null
          pre_delivery_stick_reading: number | null
          price_per_gallon_pretax: number | null
          supplier_name: string | null
          tank_id: string
          temperature_corrected_gallons: number | null
          ticket_photo_urls: string[] | null
          total_cost: number
          truck_number: string | null
          updated_at: string
          variance_flag: boolean | null
          variance_tolerance: number | null
          verified_at: string | null
          verified_by: string | null
          water_bottom_inches: number | null
          water_bottom_test_result: string | null
          winter_blend: boolean | null
        }
        Insert: {
          additive_notes?: string | null
          after_hours_delivery?: boolean | null
          blocked_reason?: string | null
          bol_ticket_number?: string | null
          calculated_variance?: number | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_date: string
          delivery_fee?: number | null
          delivery_time?: string | null
          dip_chart_url?: string | null
          driver_name?: string | null
          entered_by?: string | null
          excise_tax?: number | null
          fuel_grade?: string | null
          gallons_delivered: number
          gross_gallons?: number | null
          hazmat_fee?: number | null
          id?: string
          invoice_number?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_to_ledger?: boolean | null
          notes?: string | null
          other_fees?: Json | null
          partial_fill_blocked?: boolean | null
          payment_method?: string | null
          payment_terms?: string | null
          post_delivery_stick_reading?: number | null
          pre_delivery_stick_reading?: number | null
          price_per_gallon_pretax?: number | null
          supplier_name?: string | null
          tank_id: string
          temperature_corrected_gallons?: number | null
          ticket_photo_urls?: string[] | null
          total_cost: number
          truck_number?: string | null
          updated_at?: string
          variance_flag?: boolean | null
          variance_tolerance?: number | null
          verified_at?: string | null
          verified_by?: string | null
          water_bottom_inches?: number | null
          water_bottom_test_result?: string | null
          winter_blend?: boolean | null
        }
        Update: {
          additive_notes?: string | null
          after_hours_delivery?: boolean | null
          blocked_reason?: string | null
          bol_ticket_number?: string | null
          calculated_variance?: number | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_date?: string
          delivery_fee?: number | null
          delivery_time?: string | null
          dip_chart_url?: string | null
          driver_name?: string | null
          entered_by?: string | null
          excise_tax?: number | null
          fuel_grade?: string | null
          gallons_delivered?: number
          gross_gallons?: number | null
          hazmat_fee?: number | null
          id?: string
          invoice_number?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_to_ledger?: boolean | null
          notes?: string | null
          other_fees?: Json | null
          partial_fill_blocked?: boolean | null
          payment_method?: string | null
          payment_terms?: string | null
          post_delivery_stick_reading?: number | null
          pre_delivery_stick_reading?: number | null
          price_per_gallon_pretax?: number | null
          supplier_name?: string | null
          tank_id?: string
          temperature_corrected_gallons?: number | null
          ticket_photo_urls?: string[] | null
          total_cost?: number
          truck_number?: string | null
          updated_at?: string
          variance_flag?: boolean | null
          variance_tolerance?: number | null
          verified_at?: string | null
          verified_by?: string | null
          water_bottom_inches?: number | null
          water_bottom_test_result?: string | null
          winter_blend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_tank_deliveries_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tank_inventory_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_data: Json | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          resolved_at: string | null
          severity: string
          tank_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          severity?: string
          tank_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_tank_inventory_alerts_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tank_level_history: {
        Row: {
          change_amount_gallons: number
          change_type: string
          created_at: string
          id: string
          new_level_gallons: number
          notes: string | null
          performed_by: string | null
          previous_level_gallons: number
          reference_id: string | null
          reference_type: string | null
          tank_id: string
        }
        Insert: {
          change_amount_gallons: number
          change_type: string
          created_at?: string
          id?: string
          new_level_gallons: number
          notes?: string | null
          performed_by?: string | null
          previous_level_gallons: number
          reference_id?: string | null
          reference_type?: string | null
          tank_id: string
        }
        Update: {
          change_amount_gallons?: number
          change_type?: string
          created_at?: string
          id?: string
          new_level_gallons?: number
          notes?: string | null
          performed_by?: string | null
          previous_level_gallons?: number
          reference_id?: string | null
          reference_type?: string | null
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_tank_level_history_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tanks: {
        Row: {
          access_notes: string | null
          calibration_table_url: string | null
          capacity_gallons: number
          created_at: string
          current_level_gallons: number | null
          dispenser_type: string | null
          emergency_shutoff_location: string | null
          fire_code_permit_number: string | null
          fuel_grade: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          gps_coordinates: unknown | null
          id: string
          initial_stick_reading: number | null
          installation_date: string | null
          is_active: boolean | null
          last_inspection_date: string | null
          leak_detection_method: string | null
          location_description: string | null
          lock_id: string | null
          meter_serial_number: string | null
          next_inspection_date: string | null
          notes: string | null
          notification_emails: string[] | null
          notification_sms: string[] | null
          notify_on_low_stock: boolean | null
          overfill_protection_type: string | null
          photo_urls: string[] | null
          reorder_threshold_gallons: number | null
          requires_spcc: boolean | null
          secondary_containment_capacity: number | null
          spcc_document_url: string | null
          spcc_plan_on_file: boolean | null
          tamper_seal_number: string | null
          tank_name: string
          tank_number: string
          tank_type: string | null
          target_fill_level_gallons: number | null
          updated_at: string
          usable_capacity_gallons: number | null
        }
        Insert: {
          access_notes?: string | null
          calibration_table_url?: string | null
          capacity_gallons: number
          created_at?: string
          current_level_gallons?: number | null
          dispenser_type?: string | null
          emergency_shutoff_location?: string | null
          fire_code_permit_number?: string | null
          fuel_grade?: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          gps_coordinates?: unknown | null
          id?: string
          initial_stick_reading?: number | null
          installation_date?: string | null
          is_active?: boolean | null
          last_inspection_date?: string | null
          leak_detection_method?: string | null
          location_description?: string | null
          lock_id?: string | null
          meter_serial_number?: string | null
          next_inspection_date?: string | null
          notes?: string | null
          notification_emails?: string[] | null
          notification_sms?: string[] | null
          notify_on_low_stock?: boolean | null
          overfill_protection_type?: string | null
          photo_urls?: string[] | null
          reorder_threshold_gallons?: number | null
          requires_spcc?: boolean | null
          secondary_containment_capacity?: number | null
          spcc_document_url?: string | null
          spcc_plan_on_file?: boolean | null
          tamper_seal_number?: string | null
          tank_name: string
          tank_number: string
          tank_type?: string | null
          target_fill_level_gallons?: number | null
          updated_at?: string
          usable_capacity_gallons?: number | null
        }
        Update: {
          access_notes?: string | null
          calibration_table_url?: string | null
          capacity_gallons?: number
          created_at?: string
          current_level_gallons?: number | null
          dispenser_type?: string | null
          emergency_shutoff_location?: string | null
          fire_code_permit_number?: string | null
          fuel_grade?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          gps_coordinates?: unknown | null
          id?: string
          initial_stick_reading?: number | null
          installation_date?: string | null
          is_active?: boolean | null
          last_inspection_date?: string | null
          leak_detection_method?: string | null
          location_description?: string | null
          lock_id?: string | null
          meter_serial_number?: string | null
          next_inspection_date?: string | null
          notes?: string | null
          notification_emails?: string[] | null
          notification_sms?: string[] | null
          notify_on_low_stock?: boolean | null
          overfill_protection_type?: string | null
          photo_urls?: string[] | null
          reorder_threshold_gallons?: number | null
          requires_spcc?: boolean | null
          secondary_containment_capacity?: number | null
          spcc_document_url?: string | null
          spcc_plan_on_file?: boolean | null
          tamper_seal_number?: string | null
          tank_name?: string
          tank_number?: string
          tank_type?: string | null
          target_fill_level_gallons?: number | null
          updated_at?: string
          usable_capacity_gallons?: number | null
        }
        Relationships: []
      }
      incident_follow_up_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          incident_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          incident_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          incident_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_follow_up_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "spill_incident_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          incident_id: string
          notification_type: string
          recipient: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          incident_id: string
          notification_type: string
          recipient: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          incident_id?: string
          notification_type?: string
          recipient?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_notification_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "spill_incident_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_notification_settings: {
        Row: {
          business_hours_only: boolean
          created_at: string
          email_notifications: boolean
          id: string
          immediate_notification_for_reportable: boolean
          notification_recipients: string[]
          severity_threshold: string
          sms_notifications: boolean
          updated_at: string
        }
        Insert: {
          business_hours_only?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          immediate_notification_for_reportable?: boolean
          notification_recipients?: string[]
          severity_threshold?: string
          sms_notifications?: boolean
          updated_at?: string
        }
        Update: {
          business_hours_only?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          immediate_notification_for_reportable?: boolean
          notification_recipients?: string[]
          severity_threshold?: string
          sms_notifications?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      incident_photos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          incident_id: string | null
          photo_type: string | null
          photo_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          photo_type?: string | null
          photo_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          photo_type?: string | null
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "spill_incident_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_witnesses: {
        Row: {
          contact_info: string | null
          created_at: string | null
          id: string
          incident_id: string | null
          name: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string | null
          id?: string
          incident_id?: string | null
          name: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string | null
          id?: string
          incident_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_witnesses_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "spill_incident_reports"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
          unit_of_measure: string | null
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
          unit_of_measure?: string | null
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
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string | null
          variation_name?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      invoices: {
        Row: {
          additional_fees: number | null
          additional_fees_description: string | null
          amount: number
          billing_address: string | null
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          discount_type: string | null
          discount_value: number | null
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string | null
          job_id: string | null
          notes: string | null
          quote_id: string | null
          recurring: boolean | null
          recurring_frequency: string | null
          service_address: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          additional_fees?: number | null
          additional_fees_description?: string | null
          amount: number
          billing_address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_type?: string | null
          discount_value?: number | null
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string | null
          job_id?: string | null
          notes?: string | null
          quote_id?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          service_address?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          additional_fees?: number | null
          additional_fees_description?: string | null
          amount?: number
          billing_address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string | null
          job_id?: string | null
          notes?: string | null
          quote_id?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          service_address?: string | null
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
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
        Relationships: []
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
            foreignKeyName: "fk_job_consumables_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "fk_job_consumables_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "fk_job_consumables_consumable_id"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_consumables_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
        Relationships: []
      }
      job_drafts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          job_data: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          job_data?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          job_data?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      job_pickup_events: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          pickup_type: string
          quantity: number | null
          scheduled_date: string
          scheduled_time: string | null
          sequence_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          pickup_type: string
          quantity?: number | null
          scheduled_date: string
          scheduled_time?: string | null
          sequence_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          pickup_type?: string
          quantity?: number | null
          scheduled_date?: string
          scheduled_time?: string | null
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_pickup_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_type_consumable_recipes: {
        Row: {
          consumable_id: string
          created_at: string
          id: string
          job_type: string
          notes: string | null
          quantity_per_job: number
          updated_at: string
        }
        Insert: {
          consumable_id: string
          created_at?: string
          id?: string
          job_type: string
          notes?: string | null
          quantity_per_job?: number
          updated_at?: string
        }
        Update: {
          consumable_id?: string
          created_at?: string
          id?: string
          job_type?: string
          notes?: string | null
          quantity_per_job?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_type_consumable_recipes_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "job_type_consumable_recipes_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "job_type_consumable_recipes_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_completion_time: string | null
          assigned_template_ids: Json | null
          billing_method: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contact_id: string | null
          created_at: string
          customer_id: string
          date_returned: string | null
          default_template_id: string | null
          driver_id: string | null
          id: string
          invoiced_at: string | null
          is_priority: boolean
          is_service_job: boolean
          job_number: string
          job_type: string
          lock_notes: string | null
          locks_count: number | null
          locks_requested: boolean | null
          notes: string | null
          parent_job_id: string | null
          partial_pickups: Json | null
          quote_id: string | null
          rental_duration_days: number | null
          scheduled_date: string
          scheduled_time: string | null
          service_due_date: string | null
          service_id: string | null
          service_schedule_info: Json | null
          special_instructions: string | null
          status: string
          subscription_plan: string | null
          timezone: string | null
          total_price: number | null
          updated_at: string
          vehicle_id: string | null
          was_overdue: boolean
          zip_tied_on_dropoff: boolean | null
        }
        Insert: {
          actual_completion_time?: string | null
          assigned_template_ids?: Json | null
          billing_method?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id: string
          date_returned?: string | null
          default_template_id?: string | null
          driver_id?: string | null
          id?: string
          invoiced_at?: string | null
          is_priority?: boolean
          is_service_job?: boolean
          job_number?: string
          job_type: string
          lock_notes?: string | null
          locks_count?: number | null
          locks_requested?: boolean | null
          notes?: string | null
          parent_job_id?: string | null
          partial_pickups?: Json | null
          quote_id?: string | null
          rental_duration_days?: number | null
          scheduled_date: string
          scheduled_time?: string | null
          service_due_date?: string | null
          service_id?: string | null
          service_schedule_info?: Json | null
          special_instructions?: string | null
          status?: string
          subscription_plan?: string | null
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_id?: string | null
          was_overdue?: boolean
          zip_tied_on_dropoff?: boolean | null
        }
        Update: {
          actual_completion_time?: string | null
          assigned_template_ids?: Json | null
          billing_method?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string
          date_returned?: string | null
          default_template_id?: string | null
          driver_id?: string | null
          id?: string
          invoiced_at?: string | null
          is_priority?: boolean
          is_service_job?: boolean
          job_number?: string
          job_type?: string
          lock_notes?: string | null
          locks_count?: number | null
          locks_requested?: boolean | null
          notes?: string | null
          parent_job_id?: string | null
          partial_pickups?: Json | null
          quote_id?: string | null
          rental_duration_days?: number | null
          scheduled_date?: string
          scheduled_time?: string | null
          service_due_date?: string | null
          service_id?: string | null
          service_schedule_info?: Json | null
          special_instructions?: string | null
          status?: string
          subscription_plan?: string | null
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_id?: string | null
          was_overdue?: boolean
          zip_tied_on_dropoff?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_default_template"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jobs_driver_id"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "maintenance_records_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
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
        Relationships: []
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
          is_public: boolean | null
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
          is_public?: boolean | null
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
          is_public?: boolean | null
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
        Relationships: []
      }
      maintenance_reports: {
        Row: {
          actual_completion: string | null
          assigned_technician: string | null
          auto_generated: boolean | null
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
          service_id: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          template_id: string
          updated_at: string | null
          weather_conditions: string | null
          workflow_status: string | null
        }
        Insert: {
          actual_completion?: string | null
          assigned_technician?: string | null
          auto_generated?: boolean | null
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
          service_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          weather_conditions?: string | null
          workflow_status?: string | null
        }
        Update: {
          actual_completion?: string | null
          assigned_technician?: string | null
          auto_generated?: boolean | null
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
          service_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          weather_conditions?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintenance_reports_job"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      maintenance_sessions: {
        Row: {
          completed_at: string | null
          completion_photos: Json | null
          created_at: string
          final_condition: string | null
          id: string
          initial_condition: string | null
          initial_photos: Json | null
          item_id: string
          primary_technician: string | null
          session_number: number
          session_summary: string | null
          started_at: string
          status: string | null
          total_cost: number | null
          total_labor_hours: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_photos?: Json | null
          created_at?: string
          final_condition?: string | null
          id?: string
          initial_condition?: string | null
          initial_photos?: Json | null
          item_id: string
          primary_technician?: string | null
          session_number: number
          session_summary?: string | null
          started_at?: string
          status?: string | null
          total_cost?: number | null
          total_labor_hours?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_photos?: Json | null
          created_at?: string
          final_condition?: string | null
          id?: string
          initial_condition?: string | null
          initial_photos?: Json | null
          item_id?: string
          primary_technician?: string | null
          session_number?: number
          session_summary?: string | null
          started_at?: string
          status?: string | null
          total_cost?: number | null
          total_labor_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_sessions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
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
        Relationships: []
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
      maintenance_updates: {
        Row: {
          attachments: Json | null
          completion_notes: string | null
          completion_photos: Json | null
          cost_amount: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          item_id: string
          labor_hours: number | null
          maintenance_session_id: string | null
          parts_used: Json | null
          session_status: string | null
          status_change_from: string | null
          status_change_to: string | null
          technician_name: string | null
          title: string
          update_type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          completion_notes?: string | null
          completion_photos?: Json | null
          cost_amount?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_id: string
          labor_hours?: number | null
          maintenance_session_id?: string | null
          parts_used?: Json | null
          session_status?: string | null
          status_change_from?: string | null
          status_change_to?: string | null
          technician_name?: string | null
          title: string
          update_type?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          completion_notes?: string | null
          completion_photos?: Json | null
          cost_amount?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_id?: string
          labor_hours?: number | null
          maintenance_session_id?: string | null
          parts_used?: Json | null
          session_status?: string | null
          status_change_from?: string | null
          status_change_to?: string | null
          technician_name?: string | null
          title?: string
          update_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_updates_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_vendors: {
        Row: {
          city: string | null
          contact_name: string | null
          created_at: string
          daily_rate: number | null
          email: string | null
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          service_specialties: string[] | null
          state: string | null
          street: string | null
          street2: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          city?: string | null
          contact_name?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service_specialties?: string[] | null
          state?: string | null
          street?: string | null
          street2?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          city?: string | null
          contact_name?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service_specialties?: string[] | null
          state?: string | null
          street?: string | null
          street2?: string | null
          updated_at?: string
          zip?: string | null
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
          custom_content: string | null
          custom_message_data: Json | null
          custom_subject: string | null
          delivered_count: number | null
          id: string
          message_source: string | null
          name: string
          opened_count: number | null
          recipient_type: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_customer_types: Json | null
          target_customers: Json | null
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
          custom_content?: string | null
          custom_message_data?: Json | null
          custom_subject?: string | null
          delivered_count?: number | null
          id?: string
          message_source?: string | null
          name: string
          opened_count?: number | null
          recipient_type?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_customer_types?: Json | null
          target_customers?: Json | null
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
          custom_content?: string | null
          custom_message_data?: Json | null
          custom_subject?: string | null
          delivered_count?: number | null
          id?: string
          message_source?: string | null
          name?: string
          opened_count?: number | null
          recipient_type?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_customer_types?: Json | null
          target_customers?: Json | null
          target_segments?: Json | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mobile_fuel_service_vehicles: {
        Row: {
          created_at: string
          gallons_dispensed: number
          id: string
          odometer_reading: number | null
          service_id: string
          updated_at: string
          vehicle_id: string
          vehicle_notes: string | null
        }
        Insert: {
          created_at?: string
          gallons_dispensed: number
          id?: string
          odometer_reading?: number | null
          service_id: string
          updated_at?: string
          vehicle_id: string
          vehicle_notes?: string | null
        }
        Update: {
          created_at?: string
          gallons_dispensed?: number
          id?: string
          odometer_reading?: number | null
          service_id?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_fuel_service_vehicles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mobile_fuel_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_fuel_service_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "mobile_fuel_service_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_fuel_services: {
        Row: {
          after_hours_service: boolean | null
          cost_per_gallon: number | null
          created_at: string
          delivery_ticket_urls: string[] | null
          fees_breakdown: Json | null
          fuel_grade: string | null
          id: string
          invoice_number: string | null
          invoice_reconciled: boolean | null
          location: string | null
          location_description: string | null
          location_type: string | null
          notes: string | null
          payment_method: string | null
          price_per_gallon: number | null
          reconciliation_date: string | null
          service_date: string
          service_end_time: string | null
          service_quality_rating: number | null
          service_start_time: string | null
          total_cost: number
          total_gallons: number
          updated_at: string
          variance_flag: boolean | null
          variance_notes: string | null
          vehicles_fueled: number | null
          vendor_driver_name: string | null
          vendor_id: string
          vendor_truck_number: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          after_hours_service?: boolean | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_ticket_urls?: string[] | null
          fees_breakdown?: Json | null
          fuel_grade?: string | null
          id?: string
          invoice_number?: string | null
          invoice_reconciled?: boolean | null
          location?: string | null
          location_description?: string | null
          location_type?: string | null
          notes?: string | null
          payment_method?: string | null
          price_per_gallon?: number | null
          reconciliation_date?: string | null
          service_date: string
          service_end_time?: string | null
          service_quality_rating?: number | null
          service_start_time?: string | null
          total_cost: number
          total_gallons: number
          updated_at?: string
          variance_flag?: boolean | null
          variance_notes?: string | null
          vehicles_fueled?: number | null
          vendor_driver_name?: string | null
          vendor_id: string
          vendor_truck_number?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          after_hours_service?: boolean | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_ticket_urls?: string[] | null
          fees_breakdown?: Json | null
          fuel_grade?: string | null
          id?: string
          invoice_number?: string | null
          invoice_reconciled?: boolean | null
          location?: string | null
          location_description?: string | null
          location_type?: string | null
          notes?: string | null
          payment_method?: string | null
          price_per_gallon?: number | null
          reconciliation_date?: string | null
          service_date?: string
          service_end_time?: string | null
          service_quality_rating?: number | null
          service_start_time?: string | null
          total_cost?: number
          total_gallons?: number
          updated_at?: string
          variance_flag?: boolean | null
          variance_notes?: string | null
          vehicles_fueled?: number | null
          vendor_driver_name?: string | null
          vendor_id?: string
          vendor_truck_number?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_fuel_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "expiring_vendor_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_fuel_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "mobile_fuel_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_fuel_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_fuel_vendors: {
        Row: {
          after_hours_contact_person: string | null
          after_hours_phone: string | null
          average_response_time_hrs: number | null
          contact_person: string | null
          contract_document_url: string | null
          contract_number: string | null
          created_at: string
          delivery_hours: string | null
          dot_hazmat_permit: string | null
          email: string | null
          fuel_certifications: Json | null
          fuel_surcharge_notes: string | null
          fuel_surcharge_policy: boolean | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          insurance_document_url: string | null
          insurance_expiration_date: string | null
          is_active: boolean | null
          last_audit_date: string | null
          min_delivery_quantity_gal: number | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          preferred_contact_method: string | null
          pricing_model: string | null
          safety_status: string | null
          service_area: string | null
          service_radius_mi: number | null
          updated_at: string
          vendor_id: string | null
          vendor_name: string
          w9_document_url: string | null
        }
        Insert: {
          after_hours_contact_person?: string | null
          after_hours_phone?: string | null
          average_response_time_hrs?: number | null
          contact_person?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          created_at?: string
          delivery_hours?: string | null
          dot_hazmat_permit?: string | null
          email?: string | null
          fuel_certifications?: Json | null
          fuel_surcharge_notes?: string | null
          fuel_surcharge_policy?: boolean | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          insurance_document_url?: string | null
          insurance_expiration_date?: string | null
          is_active?: boolean | null
          last_audit_date?: string | null
          min_delivery_quantity_gal?: number | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          pricing_model?: string | null
          safety_status?: string | null
          service_area?: string | null
          service_radius_mi?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name: string
          w9_document_url?: string | null
        }
        Update: {
          after_hours_contact_person?: string | null
          after_hours_phone?: string | null
          average_response_time_hrs?: number | null
          contact_person?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          created_at?: string
          delivery_hours?: string | null
          dot_hazmat_permit?: string | null
          email?: string | null
          fuel_certifications?: Json | null
          fuel_surcharge_notes?: string | null
          fuel_surcharge_policy?: boolean | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          insurance_document_url?: string | null
          insurance_expiration_date?: string | null
          is_active?: boolean | null
          last_audit_date?: string | null
          min_delivery_quantity_gal?: number | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          pricing_model?: string | null
          safety_status?: string | null
          service_area?: string | null
          service_radius_mi?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string
          w9_document_url?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string
          metadata: Json
          notes: string | null
          original_payment_id: string | null
          payment_method: string
          reference_number: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id: string
          metadata?: Json
          notes?: string | null
          original_payment_id?: string | null
          payment_method: string
          reference_number?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string
          metadata?: Json
          notes?: string | null
          original_payment_id?: string | null
          payment_method?: string
          reference_number?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
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
      pin_inventory_assignments: {
        Row: {
          assigned_quantity: number
          coordinate_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          assigned_quantity?: number
          coordinate_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          assigned_quantity?: number
          coordinate_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_inventory_assignments_coordinate_id_fkey"
            columns: ["coordinate_id"]
            isOneToOne: false
            referencedRelation: "service_location_coordinates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_inventory_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_history: {
        Row: {
          asset_id: string
          completed_at: string
          id: string
          meter_hours: number | null
          meter_miles: number | null
          notes: string | null
          pm_schedule_id: string
          work_order_id: string | null
        }
        Insert: {
          asset_id: string
          completed_at?: string
          id?: string
          meter_hours?: number | null
          meter_miles?: number | null
          notes?: string | null
          pm_schedule_id: string
          work_order_id?: string | null
        }
        Update: {
          asset_id?: string
          completed_at?: string
          id?: string
          meter_hours?: number | null
          meter_miles?: number | null
          notes?: string | null
          pm_schedule_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_history_pm_schedule_id_fkey"
            columns: ["pm_schedule_id"]
            isOneToOne: false
            referencedRelation: "pm_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_schedules: {
        Row: {
          active: boolean
          auto_create_work_order: boolean
          company_id: string | null
          created_at: string
          created_by: string | null
          default_priority: Database["public"]["Enums"]["work_order_priority"]
          description: string | null
          grace_days: number
          grace_hours: number
          grace_miles: number
          id: string
          instructions: Json
          name: string
          trigger_days_every: number | null
          trigger_hours_every: number | null
          trigger_miles_every: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auto_create_work_order?: boolean
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          default_priority?: Database["public"]["Enums"]["work_order_priority"]
          description?: string | null
          grace_days?: number
          grace_hours?: number
          grace_miles?: number
          id?: string
          instructions?: Json
          name: string
          trigger_days_every?: number | null
          trigger_hours_every?: number | null
          trigger_miles_every?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auto_create_work_order?: boolean
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          default_priority?: Database["public"]["Enums"]["work_order_priority"]
          description?: string | null
          grace_days?: number
          grace_hours?: number
          grace_miles?: number
          id?: string
          instructions?: Json
          name?: string
          trigger_days_every?: number | null
          trigger_hours_every?: number | null
          trigger_miles_every?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pm_targets: {
        Row: {
          created_at: string
          id: string
          last_done_date: string | null
          last_done_hours: number | null
          last_done_miles: number | null
          next_due_date: string | null
          next_due_hours: number | null
          next_due_miles: number | null
          pm_schedule_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["pm_target_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_done_date?: string | null
          last_done_hours?: number | null
          last_done_miles?: number | null
          next_due_date?: string | null
          next_due_hours?: number | null
          next_due_miles?: number | null
          pm_schedule_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["pm_target_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_done_date?: string | null
          last_done_hours?: number | null
          last_done_miles?: number | null
          next_due_date?: string | null
          next_due_hours?: number | null
          next_due_miles?: number | null
          pm_schedule_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["pm_target_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_targets_pm_schedule_id_fkey"
            columns: ["pm_schedule_id"]
            isOneToOne: false
            referencedRelation: "pm_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_templates: {
        Row: {
          asset_type: string
          checklist_items: Json | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          estimated_labor_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          parts_list: Json | null
          trigger_config: Json | null
          trigger_interval: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          checklist_items?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_labor_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parts_list?: Json | null
          trigger_config?: Json | null
          trigger_interval?: number | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          checklist_items?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_labor_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parts_list?: Json | null
          trigger_config?: Json | null
          trigger_interval?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ppe_compliance_records: {
        Row: {
          boot_covers_available: boolean
          compliance_score: number | null
          created_at: string
          driver_id: string
          first_aid_kit_available: boolean
          gloves_available: boolean
          hand_sanitizer_available: boolean
          hard_hat_available: boolean
          high_vis_vest_available: boolean
          id: string
          inspection_date: string
          ppe_condition_notes: string | null
          respirator_available: boolean
          safety_glasses_available: boolean
          spill_kit_available: boolean
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          boot_covers_available?: boolean
          compliance_score?: number | null
          created_at?: string
          driver_id: string
          first_aid_kit_available?: boolean
          gloves_available?: boolean
          hand_sanitizer_available?: boolean
          hard_hat_available?: boolean
          high_vis_vest_available?: boolean
          id?: string
          inspection_date?: string
          ppe_condition_notes?: string | null
          respirator_available?: boolean
          safety_glasses_available?: boolean
          spill_kit_available?: boolean
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          boot_covers_available?: boolean
          compliance_score?: number | null
          created_at?: string
          driver_id?: string
          first_aid_kit_available?: boolean
          gloves_available?: boolean
          hand_sanitizer_available?: boolean
          hard_hat_available?: boolean
          high_vis_vest_available?: boolean
          id?: string
          inspection_date?: string
          ppe_condition_notes?: string | null
          respirator_available?: boolean
          safety_glasses_available?: boolean
          spill_kit_available?: boolean
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_compliance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "ppe_compliance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      product_item_location_transfers: {
        Row: {
          created_at: string
          from_location_id: string | null
          id: string
          notes: string | null
          product_id: string
          product_item_id: string
          quantity: number
          to_location_id: string | null
          transferred_at: string
          transferred_by: string | null
        }
        Insert: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          notes?: string | null
          product_id: string
          product_item_id: string
          quantity?: number
          to_location_id?: string | null
          transferred_at?: string
          transferred_by?: string | null
        }
        Update: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          product_item_id?: string
          quantity?: number
          to_location_id?: string | null
          transferred_at?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_item_location_transfers_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_item_location_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_item_location_transfers_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_item_location_transfers_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_item_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          is_primary: boolean | null
          photo_url: string
          product_item_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          product_item_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          product_item_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_item_photos_item"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
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
          expected_return_date: string | null
          gps_enabled: boolean | null
          id: string
          interior_features: string[] | null
          item_code: string
          last_known_location: unknown | null
          last_location_update: string | null
          last_maintenance_update: string | null
          location: string | null
          maintenance_notes: string | null
          maintenance_priority: string | null
          maintenance_reason: string | null
          maintenance_start_date: string | null
          maintenance_technician: string | null
          manufacturing_date: string | null
          material: string | null
          mold_cavity: string | null
          notes: string | null
          ocr_confidence_score: number | null
          ocr_raw_data: Json | null
          plastic_code: string | null
          power_source: string | null
          product_id: string
          product_variation_id: string | null
          qr_code_data: string | null
          size: string | null
          status: string
          tool_number: string | null
          total_maintenance_cost: number | null
          tracking_photo_url: string | null
          updated_at: string
          use_case: string | null
          vendor_id: string | null
          verification_status: string | null
          winterized: boolean | null
        }
        Insert: {
          barcode?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_storage_location_id?: string | null
          expected_return_date?: string | null
          gps_enabled?: boolean | null
          id?: string
          interior_features?: string[] | null
          item_code: string
          last_known_location?: unknown | null
          last_location_update?: string | null
          last_maintenance_update?: string | null
          location?: string | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          maintenance_reason?: string | null
          maintenance_start_date?: string | null
          maintenance_technician?: string | null
          manufacturing_date?: string | null
          material?: string | null
          mold_cavity?: string | null
          notes?: string | null
          ocr_confidence_score?: number | null
          ocr_raw_data?: Json | null
          plastic_code?: string | null
          power_source?: string | null
          product_id: string
          product_variation_id?: string | null
          qr_code_data?: string | null
          size?: string | null
          status?: string
          tool_number?: string | null
          total_maintenance_cost?: number | null
          tracking_photo_url?: string | null
          updated_at?: string
          use_case?: string | null
          vendor_id?: string | null
          verification_status?: string | null
          winterized?: boolean | null
        }
        Update: {
          barcode?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_storage_location_id?: string | null
          expected_return_date?: string | null
          gps_enabled?: boolean | null
          id?: string
          interior_features?: string[] | null
          item_code?: string
          last_known_location?: unknown | null
          last_location_update?: string | null
          last_maintenance_update?: string | null
          location?: string | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          maintenance_reason?: string | null
          maintenance_start_date?: string | null
          maintenance_technician?: string | null
          manufacturing_date?: string | null
          material?: string | null
          mold_cavity?: string | null
          notes?: string | null
          ocr_confidence_score?: number | null
          ocr_raw_data?: Json | null
          plastic_code?: string | null
          power_source?: string | null
          product_id?: string
          product_variation_id?: string | null
          qr_code_data?: string | null
          size?: string | null
          status?: string
          tool_number?: string | null
          total_maintenance_cost?: number | null
          tracking_photo_url?: string | null
          updated_at?: string
          use_case?: string | null
          vendor_id?: string | null
          verification_status?: string | null
          winterized?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "fk_product_location_stock_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_location_stock_storage_location_id"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_location_transfers: {
        Row: {
          created_at: string
          from_location_id: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          to_location_id: string
          transferred_at: string
          transferred_by: string | null
        }
        Insert: {
          created_at?: string
          from_location_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          to_location_id: string
          transferred_at?: string
          transferred_by?: string | null
        }
        Update: {
          created_at?: string
          from_location_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          to_location_id?: string
          transferred_at?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_location_transfers_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_location_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_location_transfers_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          base_image: string | null
          charge_for_product: boolean | null
          created_at: string
          daily_rate: number | null
          default_item_code_category: string | null
          default_price_per_day: number
          default_storage_location_id: string | null
          description: string | null
          fixed_price: number | null
          hourly_rate: number | null
          id: string
          image_url: string | null
          includes_lock: boolean | null
          is_active: boolean
          low_stock_threshold: number
          manufacturer: string | null
          monthly_rate: number | null
          name: string
          pricing_method: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          product_variant: string | null
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
          default_item_code_category?: string | null
          default_price_per_day: number
          default_storage_location_id?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          includes_lock?: boolean | null
          is_active?: boolean
          low_stock_threshold?: number
          manufacturer?: string | null
          monthly_rate?: number | null
          name: string
          pricing_method?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          product_variant?: string | null
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
          default_item_code_category?: string | null
          default_price_per_day?: number
          default_storage_location_id?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          includes_lock?: boolean | null
          is_active?: boolean
          low_stock_threshold?: number
          manufacturer?: string | null
          monthly_rate?: number | null
          name?: string
          pricing_method?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          product_variant?: string | null
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
          driver_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          hire_date: string | null
          home_base: string | null
          id: string
          image_url: string | null
          is_active: boolean
          last_name: string | null
          notes: string | null
          phone: string | null
          profile_photo: string | null
          status: string | null
          status_effective_date: string | null
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          driver_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          hire_date?: string | null
          home_base?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          status?: string | null
          status_effective_date?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          driver_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          hire_date?: string | null
          home_base?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          status?: string | null
          status_effective_date?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "fk_qr_feedback_unit_id"
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
        Relationships: []
      }
      quote_drafts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          quote_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          quote_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          quote_data?: Json
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      quotes: {
        Row: {
          additional_fees: number | null
          converted_to_invoice_at: string | null
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
          converted_to_invoice_at?: string | null
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
          converted_to_invoice_at?: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          default_template_id: string | null
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
          default_template_id?: string | null
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
          default_template_id?: string | null
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
            foreignKeyName: "fk_routine_maintenance_services_default_template_id"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sanitation_checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          item_key: string
          label: string
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          item_key: string
          label: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          item_key?: string
          label?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanitation_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "sanitation_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      sanitation_checklists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sanitation_logs: {
        Row: {
          checklist_id: string | null
          created_at: string
          gps: unknown | null
          id: string
          job_id: string | null
          notes: string | null
          photos: Json
          product_item_id: string | null
          responses: Json
          signed_at: string | null
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string
          gps?: unknown | null
          id?: string
          job_id?: string | null
          notes?: string | null
          photos?: Json
          product_item_id?: string | null
          responses?: Json
          signed_at?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string | null
          created_at?: string
          gps?: unknown | null
          id?: string
          job_id?: string | null
          notes?: string | null
          photos?: Json
          product_item_id?: string | null
          responses?: Json
          signed_at?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanitation_logs_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "sanitation_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanitation_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanitation_logs_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sanitation_schedules: {
        Row: {
          checklist_id: string | null
          created_at: string
          double_per_week: boolean
          frequency_days: number
          id: string
          is_active: boolean
          next_run_date: string | null
          scope: string
          target_id: string
          updated_at: string
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string
          double_per_week?: boolean
          frequency_days?: number
          id?: string
          is_active?: boolean
          next_run_date?: string | null
          scope?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string | null
          created_at?: string
          double_per_week?: boolean
          frequency_days?: number
          id?: string
          is_active?: boolean
          next_run_date?: string | null
          scope?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanitation_schedules_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "sanitation_checklists"
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
        Relationships: []
      }
      section_types: {
        Row: {
          category: string
          created_at: string
          default_settings: Json
          description: string | null
          display_name: string
          icon: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          default_settings?: Json
          description?: string | null
          display_name: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          default_settings?: Json
          description?: string | null
          display_name?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      services: {
        Row: {
          can_be_recurring: boolean | null
          category: string
          code: string | null
          consumables_recipe: Json | null
          created_at: string | null
          default_rate: number | null
          default_template_id: string | null
          description: string | null
          eligible_targets: Json | null
          estimated_duration_minutes: number | null
          evidence_requirements: Json | null
          id: string
          is_active: boolean | null
          name: string
          pricing_method: string | null
          updated_at: string | null
        }
        Insert: {
          can_be_recurring?: boolean | null
          category: string
          code?: string | null
          consumables_recipe?: Json | null
          created_at?: string | null
          default_rate?: number | null
          default_template_id?: string | null
          description?: string | null
          eligible_targets?: Json | null
          estimated_duration_minutes?: number | null
          evidence_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          pricing_method?: string | null
          updated_at?: string | null
        }
        Update: {
          can_be_recurring?: boolean | null
          category?: string
          code?: string | null
          consumables_recipe?: Json | null
          created_at?: string | null
          default_rate?: number | null
          default_template_id?: string | null
          description?: string | null
          eligible_targets?: Json | null
          estimated_duration_minutes?: number | null
          evidence_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_default_template_id_fkey"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          name: string
          shift_type: string
          start_time: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          name: string
          shift_type?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          name?: string
          shift_type?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      spill_incident_reports: {
        Row: {
          assigned_to: string | null
          authorities_notified: boolean | null
          authority_contact_info: string | null
          cause_description: string
          cleanup_actions: string[] | null
          cleanup_method: string | null
          cleanup_photos: Json | null
          closed_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          disposal_method: string | null
          driver_id: string
          environmental_impact: string | null
          estimated_volume: number | null
          gps_coordinates: unknown | null
          id: string
          immediate_action_taken: string | null
          incident_date: string
          incident_photos: Json | null
          location_description: string
          regulatory_notification_required: boolean | null
          regulatory_notification_sent: boolean | null
          resolution_notes: string | null
          responsible_party: string | null
          severity: Database["public"]["Enums"]["incident_severity"] | null
          spill_type: string
          status: string
          updated_at: string
          vehicle_id: string
          volume_estimate: number | null
          volume_unit: string | null
          weather_conditions: string | null
          witnesses_present: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          authorities_notified?: boolean | null
          authority_contact_info?: string | null
          cause_description: string
          cleanup_actions?: string[] | null
          cleanup_method?: string | null
          cleanup_photos?: Json | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          disposal_method?: string | null
          driver_id: string
          environmental_impact?: string | null
          estimated_volume?: number | null
          gps_coordinates?: unknown | null
          id?: string
          immediate_action_taken?: string | null
          incident_date: string
          incident_photos?: Json | null
          location_description: string
          regulatory_notification_required?: boolean | null
          regulatory_notification_sent?: boolean | null
          resolution_notes?: string | null
          responsible_party?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          spill_type: string
          status?: string
          updated_at?: string
          vehicle_id: string
          volume_estimate?: number | null
          volume_unit?: string | null
          weather_conditions?: string | null
          witnesses_present?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          authorities_notified?: boolean | null
          authority_contact_info?: string | null
          cause_description?: string
          cleanup_actions?: string[] | null
          cleanup_method?: string | null
          cleanup_photos?: Json | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          disposal_method?: string | null
          driver_id?: string
          environmental_impact?: string | null
          estimated_volume?: number | null
          gps_coordinates?: unknown | null
          id?: string
          immediate_action_taken?: string | null
          incident_date?: string
          incident_photos?: Json | null
          location_description?: string
          regulatory_notification_required?: boolean | null
          regulatory_notification_sent?: boolean | null
          resolution_notes?: string | null
          responsible_party?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          spill_type?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
          volume_estimate?: number | null
          volume_unit?: string | null
          weather_conditions?: string | null
          witnesses_present?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "spill_incident_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "spill_incident_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_incidents: {
        Row: {
          authority_details: string | null
          authority_notified: boolean | null
          cause: string | null
          cleanup_summary: string | null
          company_id: string | null
          corrective_actions: string | null
          cost_estimate: number | null
          created_at: string
          driver_clerk_id: string | null
          estimated_volume_liters: number | null
          id: string
          immediate_actions: string | null
          job_id: string | null
          linked_work_order_id: string | null
          location_gps: unknown | null
          location_text: string | null
          material_type: string | null
          occurred_at: string
          photos: string[]
          root_cause: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
          waste_disposition: string | null
          weather_conditions: string | null
        }
        Insert: {
          authority_details?: string | null
          authority_notified?: boolean | null
          cause?: string | null
          cleanup_summary?: string | null
          company_id?: string | null
          corrective_actions?: string | null
          cost_estimate?: number | null
          created_at?: string
          driver_clerk_id?: string | null
          estimated_volume_liters?: number | null
          id?: string
          immediate_actions?: string | null
          job_id?: string | null
          linked_work_order_id?: string | null
          location_gps?: unknown | null
          location_text?: string | null
          material_type?: string | null
          occurred_at?: string
          photos?: string[]
          root_cause?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          waste_disposition?: string | null
          weather_conditions?: string | null
        }
        Update: {
          authority_details?: string | null
          authority_notified?: boolean | null
          cause?: string | null
          cleanup_summary?: string | null
          company_id?: string | null
          corrective_actions?: string | null
          cost_estimate?: number | null
          created_at?: string
          driver_clerk_id?: string | null
          estimated_volume_liters?: number | null
          id?: string
          immediate_actions?: string | null
          job_id?: string | null
          linked_work_order_id?: string | null
          location_gps?: unknown | null
          location_text?: string | null
          material_type?: string | null
          occurred_at?: string
          photos?: string[]
          root_cause?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          waste_disposition?: string | null
          weather_conditions?: string | null
        }
        Relationships: []
      }
      spill_kit_compliance_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string
          alert_type: string
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          vehicle_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string
          alert_type: string
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          vehicle_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_compliance_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "spill_kit_compliance_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_kit_inspections: {
        Row: {
          company_id: string | null
          contents_ok: boolean
          created_at: string
          followup_work_order_id: string | null
          id: string
          inspected_at: string
          inspected_by_clerk: string | null
          missing_items: Json
          notes: string | null
          photos: string[]
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          contents_ok?: boolean
          created_at?: string
          followup_work_order_id?: string | null
          id?: string
          inspected_at?: string
          inspected_by_clerk?: string | null
          missing_items?: Json
          notes?: string | null
          photos?: string[]
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          contents_ok?: boolean
          created_at?: string
          followup_work_order_id?: string | null
          id?: string
          inspected_at?: string
          inspected_by_clerk?: string | null
          missing_items?: Json
          notes?: string | null
          photos?: string[]
          vehicle_id?: string
        }
        Relationships: []
      }
      spill_kit_inventory: {
        Row: {
          created_at: string
          current_stock: number | null
          expiration_date: string | null
          id: string
          is_critical: boolean | null
          item_name: string
          item_type: string | null
          last_restocked: string | null
          last_usage_date: string | null
          linked_template_ids: Json | null
          lot_batch_number: string | null
          minimum_threshold: number | null
          notes: string | null
          reorder_quantity: number | null
          supplier_contact: string | null
          supplier_info: Json | null
          supplier_name: string | null
          supplier_portal_url: string | null
          supplier_sku: string | null
          unit_cost: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          current_stock?: number | null
          expiration_date?: string | null
          id?: string
          is_critical?: boolean | null
          item_name: string
          item_type?: string | null
          last_restocked?: string | null
          last_usage_date?: string | null
          linked_template_ids?: Json | null
          lot_batch_number?: string | null
          minimum_threshold?: number | null
          notes?: string | null
          reorder_quantity?: number | null
          supplier_contact?: string | null
          supplier_info?: Json | null
          supplier_name?: string | null
          supplier_portal_url?: string | null
          supplier_sku?: string | null
          unit_cost?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          current_stock?: number | null
          expiration_date?: string | null
          id?: string
          is_critical?: boolean | null
          item_name?: string
          item_type?: string | null
          last_restocked?: string | null
          last_usage_date?: string | null
          linked_template_ids?: Json | null
          lot_batch_number?: string | null
          minimum_threshold?: number | null
          notes?: string | null
          reorder_quantity?: number | null
          supplier_contact?: string | null
          supplier_info?: Json | null
          supplier_name?: string | null
          supplier_portal_url?: string | null
          supplier_sku?: string | null
          unit_cost?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      spill_kit_location_stock: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          last_counted_at: string | null
          last_counted_by: string | null
          low_stock_threshold: number | null
          quantity: number
          storage_location_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          low_stock_threshold?: number | null
          quantity?: number
          storage_location_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          low_stock_threshold?: number | null
          quantity?: number
          storage_location_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_location_stock_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spill_kit_location_stock_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_kit_notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          email_recipients: string[]
          id: string
          notification_frequency: string
          overdue_threshold_days: number
          reminder_advance_days: number
          sms_notifications: boolean
          sms_recipients: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          email_recipients?: string[]
          id?: string
          notification_frequency?: string
          overdue_threshold_days?: number
          reminder_advance_days?: number
          sms_notifications?: boolean
          sms_recipients?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          email_recipients?: string[]
          id?: string
          notification_frequency?: string
          overdue_threshold_days?: number
          reminder_advance_days?: number
          sms_notifications?: boolean
          sms_recipients?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      spill_kit_restock_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          missing_items: Json
          notes: string | null
          priority: string
          requested_by: string | null
          status: string
          template_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          missing_items?: Json
          notes?: string | null
          priority?: string
          requested_by?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          missing_items?: Json
          notes?: string | null
          priority?: string
          requested_by?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_restock_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spill_kit_restock_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "spill_kit_restock_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_kit_stock_transfers: {
        Row: {
          created_at: string | null
          from_location_id: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          quantity: number
          to_location_id: string
          transfer_reason: string | null
          transferred_at: string | null
          transferred_by: string | null
        }
        Insert: {
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          quantity: number
          to_location_id: string
          transfer_reason?: string | null
          transferred_at?: string | null
          transferred_by?: string | null
        }
        Update: {
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          quantity?: number
          to_location_id?: string
          transfer_reason?: string | null
          transferred_at?: string | null
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_stock_transfers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_kit_storage_locations: {
        Row: {
          address: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          location_type: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          location_type?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          location_type?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      spill_kit_template_items: {
        Row: {
          category: string | null
          created_at: string
          critical_item: boolean | null
          display_order: number | null
          expiration_trackable: boolean | null
          id: string
          item_name: string
          required_quantity: number | null
          template_id: string
          unit_cost: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          critical_item?: boolean | null
          display_order?: number | null
          expiration_trackable?: boolean | null
          id?: string
          item_name: string
          required_quantity?: number | null
          template_id: string
          unit_cost?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          critical_item?: boolean | null
          display_order?: number | null
          expiration_trackable?: boolean | null
          id?: string
          item_name?: string
          required_quantity?: number | null
          template_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      spill_kit_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
          vehicle_types: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Relationships: []
      }
      spill_kit_usage_log: {
        Row: {
          check_id: string | null
          created_at: string | null
          id: string
          incident_id: string | null
          inventory_item_id: string
          notes: string | null
          quantity_used: number
          used_at: string
          used_by_clerk: string | null
          vehicle_id: string | null
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          id?: string
          incident_id?: string | null
          inventory_item_id: string
          notes?: string | null
          quantity_used: number
          used_at?: string
          used_by_clerk?: string | null
          vehicle_id?: string | null
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          id?: string
          incident_id?: string | null
          inventory_item_id?: string
          notes?: string | null
          quantity_used?: number
          used_at?: string
          used_by_clerk?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spill_kit_usage_log_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "vehicle_spill_kit_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spill_kit_usage_log_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spill_kit_usage_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "spill_kit_usage_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
        Relationships: []
      }
      storage_locations: {
        Row: {
          address_type: string
          capacity_limit: number | null
          company_address_id: string | null
          contact_person: string | null
          contact_phone: string | null
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
          location_type: string | null
          name: string
          notes: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          address_type?: string
          capacity_limit?: number | null
          company_address_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
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
          location_type?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          address_type?: string
          capacity_limit?: number | null
          company_address_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
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
          location_type?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "storage_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      tank_hose_inspections: {
        Row: {
          certification_number: string | null
          created_at: string
          defects_found: string | null
          fittings_condition: string
          hose_condition: string
          id: string
          inspection_date: string
          inspection_photos: Json | null
          inspector_id: string
          inspector_signature: string | null
          leak_test_passed: boolean
          next_inspection_due: string | null
          overall_status: string
          pressure_test_passed: boolean | null
          pressure_test_psi: number | null
          repair_recommendations: string | null
          tank_exterior_condition: string
          tank_interior_condition: string
          updated_at: string
          valve_operation: string
          vehicle_id: string
        }
        Insert: {
          certification_number?: string | null
          created_at?: string
          defects_found?: string | null
          fittings_condition: string
          hose_condition: string
          id?: string
          inspection_date?: string
          inspection_photos?: Json | null
          inspector_id: string
          inspector_signature?: string | null
          leak_test_passed: boolean
          next_inspection_due?: string | null
          overall_status?: string
          pressure_test_passed?: boolean | null
          pressure_test_psi?: number | null
          repair_recommendations?: string | null
          tank_exterior_condition: string
          tank_interior_condition: string
          updated_at?: string
          valve_operation: string
          vehicle_id: string
        }
        Update: {
          certification_number?: string | null
          created_at?: string
          defects_found?: string | null
          fittings_condition?: string
          hose_condition?: string
          id?: string
          inspection_date?: string
          inspection_photos?: Json | null
          inspector_id?: string
          inspector_signature?: string | null
          leak_test_passed?: boolean
          next_inspection_due?: string | null
          overall_status?: string
          pressure_test_passed?: boolean | null
          pressure_test_psi?: number | null
          repair_recommendations?: string | null
          tank_exterior_condition?: string
          tank_interior_condition?: string
          updated_at?: string
          valve_operation?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_hose_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "tank_hose_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          city: string | null
          county: string | null
          created_at: string
          description: string | null
          effective_date: string | null
          id: string
          state: string | null
          tax_rate: number
          updated_at: string
          zip_code: string
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          state?: string | null
          tax_rate?: number
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          state?: string | null
          tax_rate?: number
          updated_at?: string
          zip_code?: string
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
        Relationships: []
      }
      template_sections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          position: number
          section_type: string
          settings: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          section_type: string
          settings?: Json
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          section_type?: string
          settings?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      training_requirements: {
        Row: {
          certification_type_id: string
          created_at: string
          frequency_months: number | null
          id: string
          is_required: boolean
          role: string
          updated_at: string
        }
        Insert: {
          certification_type_id: string
          created_at?: string
          frequency_months?: number | null
          id?: string
          is_required?: boolean
          role: string
          updated_at?: string
        }
        Update: {
          certification_type_id?: string
          created_at?: string
          frequency_months?: number | null
          id?: string
          is_required?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_requirements_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          clerk_user_id: string | null
          created_at: string | null
          email: string
          error_message: string | null
          expires_at: string
          first_name: string | null
          id: string
          invitation_token: string
          invitation_type: string | null
          invited_by: string
          last_name: string | null
          metadata: Json | null
          phone: string | null
          role: string | null
          sent_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          clerk_user_id?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_token: string
          invitation_type?: string | null
          invited_by: string
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          role?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          clerk_user_id?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_token?: string
          invitation_type?: string | null
          invited_by?: string
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          role?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_annual_inspections: {
        Row: {
          certificate_url: string | null
          company_id: string | null
          created_at: string
          created_by_clerk: string | null
          expires_on: string | null
          id: string
          inspection_date: string
          inspector_name: string | null
          notes: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          certificate_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          expires_on?: string | null
          id?: string
          inspection_date: string
          inspector_name?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          certificate_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          expires_on?: string | null
          id?: string
          inspection_date?: string
          inspector_name?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
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
        Relationships: []
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
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
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
          custom_field_values: Json | null
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
          last_reminder_sent_at: string | null
          linked_maintenance_record_id: string | null
          notes: string | null
          reminder_sent: boolean | null
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
          custom_field_values?: Json | null
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
          last_reminder_sent_at?: string | null
          linked_maintenance_record_id?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
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
          custom_field_values?: Json | null
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
          last_reminder_sent_at?: string | null
          linked_maintenance_record_id?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          tags?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_dvir_logs: {
        Row: {
          corrective_action: string | null
          created_at: string
          defects_description: string | null
          defects_found: boolean
          driver_id: string
          id: string
          inspection_date: string
          inspection_type: string
          inspector_signature: string | null
          next_inspection_due: string | null
          odometer_reading: number | null
          photos: Json | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          defects_description?: string | null
          defects_found?: boolean
          driver_id: string
          id?: string
          inspection_date?: string
          inspection_type: string
          inspector_signature?: string | null
          next_inspection_due?: string | null
          odometer_reading?: number | null
          photos?: Json | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          defects_description?: string | null
          defects_found?: boolean
          driver_id?: string
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_signature?: string | null
          next_inspection_due?: string | null
          odometer_reading?: number | null
          photos?: Json | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_dvir_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_dvir_logs_vehicle_id_fkey"
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
        Relationships: []
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
      vehicle_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_important: boolean | null
          note_text: string
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          note_text: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          note_text?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_notes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_notes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_permits: {
        Row: {
          authority_name: string | null
          company_id: string | null
          created_at: string
          created_by_clerk: string | null
          document_url: string | null
          expires_on: string | null
          id: string
          issued_on: string | null
          notes: string | null
          permit_number: string | null
          permit_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          authority_name?: string | null
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          document_url?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          authority_name?: string | null
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          document_url?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_pm_schedules: {
        Row: {
          active: boolean
          baseline_date: string | null
          baseline_engine_hours: number | null
          baseline_mileage: number | null
          created_at: string
          created_by: string | null
          id: string
          last_completed_at: string | null
          last_work_order_id: string | null
          next_due_date: string | null
          next_due_engine_hours: number | null
          next_due_mileage: number | null
          notes: string | null
          status: string
          template_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          baseline_date?: string | null
          baseline_engine_hours?: number | null
          baseline_mileage?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_completed_at?: string | null
          last_work_order_id?: string | null
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_mileage?: number | null
          notes?: string | null
          status?: string
          template_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          baseline_date?: string | null
          baseline_engine_hours?: number | null
          baseline_mileage?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_completed_at?: string | null
          last_work_order_id?: string | null
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_mileage?: number | null
          notes?: string | null
          status?: string
          template_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_sds_tracking: {
        Row: {
          chemical_name: string
          created_at: string
          emergency_contact_info: string | null
          expiration_date: string | null
          hazard_classification: string | null
          id: string
          is_active: boolean
          last_verified_date: string | null
          notes: string | null
          quantity_on_board: number | null
          sds_document_url: string | null
          storage_location_in_vehicle: string | null
          unit_of_measure: string | null
          updated_at: string
          vehicle_id: string
          verified_by: string | null
        }
        Insert: {
          chemical_name: string
          created_at?: string
          emergency_contact_info?: string | null
          expiration_date?: string | null
          hazard_classification?: string | null
          id?: string
          is_active?: boolean
          last_verified_date?: string | null
          notes?: string | null
          quantity_on_board?: number | null
          sds_document_url?: string | null
          storage_location_in_vehicle?: string | null
          unit_of_measure?: string | null
          updated_at?: string
          vehicle_id: string
          verified_by?: string | null
        }
        Update: {
          chemical_name?: string
          created_at?: string
          emergency_contact_info?: string | null
          expiration_date?: string | null
          hazard_classification?: string | null
          id?: string
          is_active?: boolean
          last_verified_date?: string | null
          notes?: string | null
          quantity_on_board?: number | null
          sds_document_url?: string | null
          storage_location_in_vehicle?: string | null
          unit_of_measure?: string | null
          updated_at?: string
          vehicle_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_sds_tracking_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_sds_tracking_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_spill_kit_checks: {
        Row: {
          checked_at: string
          checked_by_clerk: string | null
          completion_status: string | null
          contents: Json
          created_at: string
          deleted_at: string | null
          has_kit: boolean
          id: string
          inspection_duration_minutes: number | null
          item_conditions: Json | null
          next_check_due: string | null
          notes: string | null
          photos: string[] | null
          template_id: string | null
          updated_at: string
          vehicle_id: string
          weather_conditions: string | null
          weather_details: string | null
        }
        Insert: {
          checked_at?: string
          checked_by_clerk?: string | null
          completion_status?: string | null
          contents?: Json
          created_at?: string
          deleted_at?: string | null
          has_kit: boolean
          id?: string
          inspection_duration_minutes?: number | null
          item_conditions?: Json | null
          next_check_due?: string | null
          notes?: string | null
          photos?: string[] | null
          template_id?: string | null
          updated_at?: string
          vehicle_id: string
          weather_conditions?: string | null
          weather_details?: string | null
        }
        Update: {
          checked_at?: string
          checked_by_clerk?: string | null
          completion_status?: string | null
          contents?: Json
          created_at?: string
          deleted_at?: string | null
          has_kit?: boolean
          id?: string
          inspection_duration_minutes?: number | null
          item_conditions?: Json | null
          next_check_due?: string | null
          notes?: string | null
          photos?: string[] | null
          template_id?: string | null
          updated_at?: string
          vehicle_id?: string
          weather_conditions?: string | null
          weather_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_spill_kit_checks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "spill_kit_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_spill_kit_checks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_spill_kit_checks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_spill_kits: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          created_by_clerk: string | null
          id: string
          kit_identifier: string | null
          required_contents: Json
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          id?: string
          kit_identifier?: string | null
          required_contents?: Json
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          created_by_clerk?: string | null
          id?: string
          kit_identifier?: string | null
          required_contents?: Json
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
          meter_hours: number | null
          meter_miles: number | null
          model: string
          next_maintenance_due_date: string | null
          next_maintenance_due_miles: number | null
          nickname: string | null
          notes: string | null
          out_of_service: boolean | null
          pending_driver_verification: boolean | null
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
          meter_hours?: number | null
          meter_miles?: number | null
          model: string
          next_maintenance_due_date?: string | null
          next_maintenance_due_miles?: number | null
          nickname?: string | null
          notes?: string | null
          out_of_service?: boolean | null
          pending_driver_verification?: boolean | null
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
          meter_hours?: number | null
          meter_miles?: number | null
          model?: string
          next_maintenance_due_date?: string | null
          next_maintenance_due_miles?: number | null
          nickname?: string | null
          notes?: string | null
          out_of_service?: boolean | null
          pending_driver_verification?: boolean | null
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
      work_order_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          item_name: string
          notes: string | null
          photos: string[] | null
          severity: string | null
          status: string | null
          updated_at: string | null
          work_order_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          notes?: string | null
          photos?: string[] | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          work_order_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          photos?: string[] | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_labor: {
        Row: {
          created_at: string | null
          end_time: string | null
          hourly_rate: number | null
          hours: number
          id: string
          is_active: boolean | null
          notes: string | null
          start_time: string | null
          technician_name: string
          updated_at: string | null
          work_order_id: string
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_time?: string | null
          technician_name: string
          updated_at?: string | null
          work_order_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_time?: string | null
          technician_name?: string
          updated_at?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_labor_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_lines: {
        Row: {
          description: string
          hours: number | null
          id: string
          line_type: string
          qty: number | null
          sku: string | null
          total: number | null
          unit_cost: number | null
          work_order_id: string
        }
        Insert: {
          description: string
          hours?: number | null
          id?: string
          line_type: string
          qty?: number | null
          sku?: string | null
          total?: number | null
          unit_cost?: number | null
          work_order_id: string
        }
        Update: {
          description?: string
          hours?: number | null
          id?: string
          line_type?: string
          qty?: number | null
          sku?: string | null
          total?: number | null
          unit_cost?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_lines_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_parts: {
        Row: {
          consumable_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          part_name: string
          quantity: number
          source: string | null
          unit_cost: number | null
          updated_at: string | null
          work_order_id: string
        }
        Insert: {
          consumable_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          part_name: string
          quantity?: number
          source?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          work_order_id: string
        }
        Update: {
          consumable_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          part_name?: string
          quantity?: number
          source?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_parts_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "work_order_parts_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "work_order_parts_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          assigned_to: string | null
          attachments: string[] | null
          closed_at: string | null
          closed_by: string | null
          company_id: string | null
          created_at: string
          description: string | null
          driver_verification_required: boolean
          due_date: string | null
          id: string
          labor_rate: number
          meter_close_hours: number | null
          meter_close_miles: number | null
          meter_open_hours: number | null
          meter_open_miles: number | null
          opened_at: string
          opened_by: string | null
          priority: Database["public"]["Enums"]["work_order_priority"]
          resolution_notes: string | null
          source: Database["public"]["Enums"]["work_order_source"]
          status: Database["public"]["Enums"]["work_order_status"]
          tax_amount: number
          total_cost: number
          total_labor_hours: number
          total_parts_cost: number
          updated_at: string
        }
        Insert: {
          asset_id: string
          asset_type: Database["public"]["Enums"]["dvir_asset_type"]
          assigned_to?: string | null
          attachments?: string[] | null
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          driver_verification_required?: boolean
          due_date?: string | null
          id?: string
          labor_rate?: number
          meter_close_hours?: number | null
          meter_close_miles?: number | null
          meter_open_hours?: number | null
          meter_open_miles?: number | null
          opened_at?: string
          opened_by?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          resolution_notes?: string | null
          source: Database["public"]["Enums"]["work_order_source"]
          status?: Database["public"]["Enums"]["work_order_status"]
          tax_amount?: number
          total_cost?: number
          total_labor_hours?: number
          total_parts_cost?: number
          updated_at?: string
        }
        Update: {
          asset_id?: string
          asset_type?: Database["public"]["Enums"]["dvir_asset_type"]
          assigned_to?: string | null
          attachments?: string[] | null
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          driver_verification_required?: boolean
          due_date?: string | null
          id?: string
          labor_rate?: number
          meter_close_hours?: number | null
          meter_close_miles?: number | null
          meter_open_hours?: number | null
          meter_open_miles?: number | null
          opened_at?: string
          opened_by?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          resolution_notes?: string | null
          source?: Database["public"]["Enums"]["work_order_source"]
          status?: Database["public"]["Enums"]["work_order_status"]
          tax_amount?: number
          total_cost?: number
          total_labor_hours?: number
          total_parts_cost?: number
          updated_at?: string
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
      consumable_daily_usage_90: {
        Row: {
          consumable_id: string | null
          consumed_qty: number | null
          usage_date: string | null
        }
        Relationships: []
      }
      consumable_velocity_stats: {
        Row: {
          adu_30: number | null
          adu_365: number | null
          adu_7: number | null
          adu_90: number | null
          consumable_id: string | null
          days_of_supply: number | null
          lead_time_days: number | null
          on_hand_qty: number | null
          recommended_order_qty: number | null
          reorder_point: number | null
          sigma_30: number | null
          target_days_supply: number | null
        }
        Relationships: []
      }
      expiring_documents: {
        Row: {
          category: string | null
          days_until_expiration: number | null
          document_name: string | null
          expiration_date: string | null
          file_path: string | null
          id: string | null
          license_plate: string | null
          reminder_days_before: number | null
          reminder_sent: boolean | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      expiring_vendor_compliance: {
        Row: {
          audit_overdue: boolean | null
          id: string | null
          insurance_expiration_date: string | null
          insurance_expiring_soon: boolean | null
          last_audit_date: string | null
          safety_status: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      incident_analytics: {
        Row: {
          avg_resolution_hours: number | null
          closed_incidents: number | null
          major_incidents: number | null
          minor_incidents: number | null
          moderate_incidents: number | null
          open_incidents: number | null
          period: string | null
          regulatory_required: number | null
          reportable_incidents: number | null
          total_incidents: number | null
        }
        Relationships: []
      }
      job_materials_cost: {
        Row: {
          job_id: string | null
          total_material_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_consumables_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_fuel_consumption: {
        Row: {
          cost: number | null
          cost_per_gallon: number | null
          created_at: string | null
          driver_id: string | null
          fuel_date: string | null
          fuel_type: string | null
          gallons: number | null
          notes: string | null
          odometer_reading: number | null
          reference_id: string | null
          source_name: string | null
          source_type: string | null
          tank_id: string | null
          vehicle_id: string | null
          vendor_id: string | null
        }
        Relationships: []
      }
      vehicle_consumable_balances: {
        Row: {
          balance_qty: number | null
          consumable_id: string | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_daily_usage_90"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable_velocity_stats"
            referencedColumns: ["consumable_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_quick_metrics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "consumable_stock_ledger_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_quick_metrics: {
        Row: {
          docs_expiring_30d: number | null
          dvirs_last_30d: number | null
          incidents_last_30d: number | null
          last_dvir_date: string | null
          last_dvir_status: Database["public"]["Enums"]["dvir_status"] | null
          open_work_orders: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      vehicle_recent_activity: {
        Row: {
          activity_date: string | null
          activity_id: string | null
          activity_summary: string | null
          activity_type: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      vendor_performance_metrics: {
        Row: {
          average_response_time_hrs: number | null
          avg_cost_per_gallon: number | null
          compliance_warning: boolean | null
          fuel_surcharge_policy: boolean | null
          id: string | null
          last_service_date: string | null
          payment_terms: string | null
          pricing_model: string | null
          safety_status: string | null
          service_radius_mi: number | null
          total_gallons_delivered: number | null
          total_services: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_customer_note: {
        Args: {
          clerk_user_id?: string
          customer_uuid: string
          is_important_flag?: boolean
          note_content: string
        }
        Returns: string
      }
      add_job_note: {
        Args: {
          driver_uuid: string
          job_uuid: string
          note_category?: string
          note_content: string
        }
        Returns: string
      }
      add_tracked_inventory: {
        Args: { add_qty: number; product_uuid: string }
        Returns: Json
      }
      adjust_master_stock: {
        Args: {
          notes_text?: string
          product_uuid: string
          quantity_change: number
          reason_text: string
        }
        Returns: Json
      }
      adjust_stock_for_job_completion: {
        Args: { job_type_param: string; job_uuid: string }
        Returns: boolean
      }
      auto_fix_storage_location_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_populate_location_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backup_compliance_documents: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      batch_geocode_existing_locations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      batch_geocode_service_locations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      bulk_update_service_status: {
        Args: {
          new_status: string
          record_ids: string[]
          updated_by_user?: string
        }
        Returns: Json
      }
      calculate_customer_job_count: {
        Args: { customer_uuid: string }
        Returns: number
      }
      calculate_customer_total_spent: {
        Args: { customer_uuid: string }
        Returns: number
      }
      calculate_daily_vehicle_loads: {
        Args: { target_date: string }
        Returns: undefined
      }
      calculate_days_of_coverage: {
        Args: { tank_uuid: string }
        Returns: number
      }
      calculate_delivery_variance: {
        Args: { delivery_uuid: string }
        Returns: Json
      }
      calculate_fleet_efficiency_trends: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      calculate_report_metrics: {
        Args:
          | Record<PropertyKey, never>
          | { end_date?: string; start_date?: string }
        Returns: Json
      }
      calculate_revenue_analytics: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      calculate_segment_customer_count: {
        Args: { segment_id: string }
        Returns: number
      }
      calculate_smart_segment_size: {
        Args: { rules_json: Json } | { segment_type: string }
        Returns: number
      }
      calculate_tank_cost_per_gallon: {
        Args: { tank_uuid: string }
        Returns: number
      }
      can_delete_user: {
        Args: { user_uuid: string }
        Returns: Json
      }
      check_and_flag_overdue_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_fuel_grade_mismatch: {
        Args: { delivered_grade: string; tank_uuid: string }
        Returns: Json
      }
      check_spcc_compliance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_tank_inspections_due: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_tank_low_inventory: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_unit_availability: {
        Args: { end_date: string; start_date: string; unit_id: string }
        Returns: boolean
      }
      cleanup_duplicate_service_locations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_failed_geocoding: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_activity_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      complete_work_order: {
        Args: { _closed_by?: string; work_order_uuid: string }
        Returns: Json
      }
      convert_bulk_to_tracked: {
        Args: { convert_qty: number; product_uuid: string }
        Returns: Json
      }
      create_default_service_locations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_template_version: {
        Args: {
          change_details_data?: Json
          change_summary_text?: string
          creator_id?: string
          new_field_definitions: Json
          new_template_data: Json
          template_uuid: string
        }
        Returns: string
      }
      dismiss_overdue_invoice: {
        Args: { dismiss_reason?: string; invoice_uuid: string }
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
              email_param?: string
              first_name_param?: string
              last_name_param?: string
              role_param?: string
            }
        Returns: string
      }
      export_incident_data: {
        Args: {
          end_date?: string
          severity_filter?: string
          start_date?: string
          status_filter?: string
        }
        Returns: {
          cause_description: string
          cleanup_action_count: number
          created_date: string
          incident_id: string
          location_description: string
          photo_count: number
          regulatory_required: boolean
          regulatory_sent: boolean
          responsible_party: string
          severity: string
          spill_type: string
          status: string
          vehicle_license_plate: string
          volume_estimate: number
          volume_unit: string
          witness_count: number
        }[]
      }
      export_maintenance_data: {
        Args: {
          end_date?: string
          export_format?: string
          start_date?: string
          vehicle_ids?: string[]
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
          features?: string
          one_time_use?: boolean
        }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
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
      generate_item_code_with_category: {
        Args: { category_prefix: string }
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
      generate_spill_kit_compliance_report: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_vehicle_ids?: string[]
        }
        Returns: Json
      }
      generate_spill_kit_restock_request: {
        Args: {
          p_missing_items: Json
          p_template_id?: string
          p_vehicle_id: string
        }
        Returns: string
      }
      generate_storage_location_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_vendor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      geocode_and_create_service_location: {
        Args: {
          p_city: string
          p_customer_id: string
          p_location_name: string
          p_state: string
          p_street: string
          p_street2?: string
          p_zip: string
        }
        Returns: string
      }
      get_available_units: {
        Args: { end_date: string; product_type_id: string; start_date: string }
        Returns: {
          item_code: string
          item_id: string
          location: unknown
          status: string
        }[]
      }
      get_available_vehicles: {
        Args: { end_date: string; start_date: string }
        Returns: {
          license_plate: string
          location: unknown
          vehicle_id: string
          vehicle_type: string
        }[]
      }
      get_compliance_notification_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_comprehensive_stock_breakdown: {
        Args: { product_uuid?: string }
        Returns: {
          bulk_pool: number
          individual_assigned: number
          individual_available: number
          individual_items_count: number
          maintenance_count: number
          master_stock: number
          physically_available: number
          product_id: string
          product_name: string
          reserved_count: number
        }[]
      }
      get_consumable_forecast: {
        Args: { end_date: string; start_date: string }
        Returns: {
          consumable_id: string
          consumable_name: string
          deficit: number
          on_hand: number
          required_qty: number
          suggested_order_qty: number
        }[]
      }
      get_consumables_with_location_stock: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          id: string
          is_active: boolean
          location_stock: Json
          name: string
          on_hand_qty: number
          reorder_threshold: number
          sku: string
          unit_cost: number
          unit_price: number
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
      get_customer_last_job_date: {
        Args: { customer_uuid: string }
        Returns: string
      }
      get_customer_notes_with_users: {
        Args: { customer_uuid: string }
        Returns: {
          created_at: string
          created_by: string
          customer_id: string
          id: string
          is_important: boolean
          note_text: string
          updated_at: string
          updated_by: string
          user_email: string
          user_first_name: string
          user_last_name: string
        }[]
      }
      get_customer_type_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          both_count: number
          customer_type: string
          email_count: number
          sms_count: number
          total_count: number
        }[]
      }
      get_drivers_with_hours: {
        Args: Record<PropertyKey, never>
        Returns: {
          first_name: string
          id: string
          last_name: string
          working_hours: Json
        }[]
      }
      get_fuel_metrics: {
        Args: { end_date: string; start_date: string }
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
      get_invoice_metrics_ytd: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_invoice_payment_totals: {
        Args: { invoice_uuid: string }
        Returns: Json
      }
      get_job_notes: {
        Args: { job_uuid: string }
        Returns: {
          created_at: string
          driver_id: string
          id: string
          job_id: string
          note_text: string
          note_type: string
        }[]
      }
      get_jobs_for_quote: {
        Args: { quote_uuid: string }
        Returns: {
          created_at: string
          job_id: string
          job_number: string
          job_type: string
          scheduled_date: string
          status: string
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
        Args: { end_date: string; start_date: string }
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
          amount: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          days_overdue: number
          due_date: string
          id: string
          invoice_number: string
        }[]
      }
      get_overdue_invoices_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_overdue_padlocked_units: {
        Args: Record<PropertyKey, never>
        Returns: {
          days_overdue: number
          item_code: string
          item_id: string
          last_padlock_timestamp: string
          padlock_type: string
          product_name: string
        }[]
      }
      get_overdue_spill_kit_checks: {
        Args: Record<PropertyKey, never>
        Returns: {
          compliance_status: string
          days_overdue: number
          last_check_date: string
          license_plate: string
          vehicle_id: string
        }[]
      }
      get_padlock_security_incidents: {
        Args: {
          limit_count?: number
          severity_filter?: string
          status_filter?: string
        }
        Returns: {
          days_since_reported: number
          description: string
          incident_id: string
          incident_type: string
          item_code: string
          item_id: string
          product_name: string
          reported_at: string
          severity: string
          status: string
        }[]
      }
      get_product_availability_enhanced: {
        Args: {
          end_date: string
          filter_attributes?: Json
          product_type_id: string
          start_date: string
        }
        Returns: Json
      }
      get_quote_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_quote_metrics_ytd: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_recent_fuel_logs: {
        Args: { limit_count?: number }
        Returns: {
          cost_per_gallon: number
          driver_name: string
          fuel_station: string
          gallons_purchased: number
          id: string
          log_date: string
          odometer_reading: number
          total_cost: number
          vehicle_license: string
        }[]
      }
      get_route_stock_status: {
        Args: { service_date: string; vehicle_uuid: string }
        Returns: {
          consumable_id: string
          consumable_name: string
          deficit: number
          needed_qty: number
          ok: boolean
          vehicle_balance: number
        }[]
      }
      get_service_analytics: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_spill_kit_template_for_vehicle: {
        Args: { vehicle_type_param: string }
        Returns: {
          items: Json
          template_id: string
          template_name: string
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
      get_vehicle_activity: {
        Args: { p_limit?: number; p_vehicle_id: string }
        Returns: {
          activity_date: string
          activity_id: string
          activity_summary: string
          activity_type: string
        }[]
      }
      get_vehicle_efficiency: {
        Args: { end_date: string; start_date: string }
        Returns: {
          cost_per_mile: number
          license_plate: string
          mpg: number
          total_cost: number
          total_gallons: number
          total_miles: number
          vehicle_id: string
        }[]
      }
      get_vehicle_metrics: {
        Args: { p_vehicle_id: string }
        Returns: {
          docs_expiring_30d: number
          dvirs_last_30d: number
          incidents_last_30d: number
          last_dvir_date: string
          last_dvir_status: string
          open_work_orders: number
        }[]
      }
      get_vehicle_summary: {
        Args: { p_vehicle_id: string }
        Returns: Json
      }
      handle_padlock_operation: {
        Args: {
          code_reference?: string
          item_uuid: string
          location_coords?: unknown
          notes_param?: string
          operation_type: string
          padlock_type_param?: string
          user_uuid: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lock_delivery_to_ledger: {
        Args: { delivery_uuid: string; locked_by_user: string }
        Returns: boolean
      }
      log_job_status_change: {
        Args: {
          change_notes?: string
          changed_by_uuid: string
          job_uuid: string
          lat?: number
          lng?: number
          new_status_value: string
        }
        Returns: string
      }
      log_padlock_code_access: {
        Args: {
          ip_param?: string
          item_uuid: string
          reason_text?: string
          session_id_param?: string
          user_agent_param?: string
          user_uuid: string
        }
        Returns: Json
      }
      migrate_consumable_stock_to_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          migrated_consumables: number
          total_stock_migrated: number
        }[]
      }
      migrate_consumables_to_default_location: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_customer_zip_codes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      open_work_order_for_defect: {
        Args: { _opened_by?: string; defect_uuid: string }
        Returns: string
      }
      preview_next_item_code: {
        Args: { category_prefix: string }
        Returns: string
      }
      quote_has_job: {
        Args: { quote_uuid: string }
        Returns: boolean
      }
      refresh_revenue_analytics_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_vendor_compliance_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      report_padlock_incident: {
        Args: {
          description_param: string
          incident_type_param: string
          item_uuid: string
          severity_param?: string
          user_uuid: string
        }
        Returns: Json
      }
      reserve_equipment_for_job: {
        Args: {
          assignment_date: string
          job_uuid: string
          product_uuid: string
          reserve_quantity: number
          return_date?: string
        }
        Returns: Json
      }
      reserve_specific_item_for_job: {
        Args: {
          assignment_date: string
          item_uuid: string
          job_uuid: string
          return_date?: string
        }
        Returns: Json
      }
      rollback_template_version: {
        Args: {
          rollback_reason?: string
          target_version_number: number
          template_uuid: string
        }
        Returns: boolean
      }
      search_service_records: {
        Args: {
          end_date?: string
          limit_count?: number
          offset_count?: number
          search_term?: string
          start_date?: string
          status_filter?: string
        }
        Returns: {
          assigned_technician_name: string
          completion_percentage: number
          created_at: string
          customer_name: string
          estimated_completion: string
          id: string
          location: string
          priority_level: string
          report_number: string
          service_type: string
          status: string
        }[]
      }
      soft_delete_quote: {
        Args: { quote_uuid: string }
        Returns: boolean
      }
      sync_clerk_profile: {
        Args: {
          clerk_user_id_param: string
          email_param: string
          first_name_param: string
          image_url_param: string
          last_name_param: string
        }
        Returns: string
      }
      sync_consumable_total_from_locations: {
        Args: { consumable_uuid: string }
        Returns: undefined
      }
      sync_product_stock_totals: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      track_template_usage: {
        Args:
          | {
              customer_uuid?: string
              job_uuid?: string
              report_uuid?: string
              template_uuid: string
              user_uuid?: string
            }
          | { template_uuid: string }
        Returns: boolean
      }
      transition_report_status: {
        Args: {
          new_status: string
          report_uuid: string
          transition_notes?: string
          user_uuid?: string
        }
        Returns: boolean
      }
      update_customer_note: {
        Args: {
          clerk_user_id?: string
          is_important_flag?: boolean
          note_content: string
          note_uuid: string
        }
        Returns: boolean
      }
      update_incident_status: {
        Args: {
          incident_uuid: string
          new_status: string
          resolution_notes_param?: string
          user_uuid: string
        }
        Returns: Json
      }
      update_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_tank_level: {
        Args: {
          p_change_amount: number
          p_change_type: string
          p_notes?: string
          p_performed_by?: string
          p_reference_id?: string
          p_reference_type?: string
          p_tank_id: string
        }
        Returns: Json
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
          customer_email: string
          customer_id: string
          customer_name: string
        }[]
      }
      validate_storage_location_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_delivery: {
        Args: { delivery_uuid: string; verified_by_user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dispatch" | "driver" | "dispatcher"
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
        | "bars_restaurants"
        | "retail"
        | "other"
      defect_severity: "minor" | "major"
      defect_status: "open" | "in_work" | "closed"
      dvir_asset_type: "vehicle" | "trailer"
      dvir_report_type: "pre_trip" | "post_trip"
      dvir_status:
        | "draft"
        | "submitted"
        | "defects_found"
        | "verified"
        | "rejected"
      fuel_source: "retail_station" | "yard_tank" | "mobile_vendor"
      fuel_type: "diesel" | "gasoline" | "off_road_diesel"
      incident_severity:
        | "minor"
        | "moderate"
        | "major"
        | "reportable"
        | "near_miss"
      pm_target_type: "vehicle" | "trailer" | "group"
      product_type:
        | "standard_toilet"
        | "ada_toilet"
        | "deluxe_toilet"
        | "high_rise_toilet"
        | "handwashing_station_single"
        | "handwashing_station_double"
        | "restroom_trailer"
        | "shower_trailer"
        | "holding_tank"
        | "urinal_stand"
        | "sanitizer_stand"
        | "accessories"
        | "custom"
      work_order_priority: "low" | "normal" | "high" | "critical"
      work_order_source:
        | "dvir_defect"
        | "pm"
        | "breakdown"
        | "recall"
        | "campaign"
        | "other"
      work_order_status:
        | "open"
        | "awaiting_parts"
        | "in_progress"
        | "vendor"
        | "on_hold"
        | "ready_for_verification"
        | "completed"
        | "canceled"
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
      app_role: ["admin", "dispatch", "driver", "dispatcher"],
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
        "bars_restaurants",
        "retail",
        "other",
      ],
      defect_severity: ["minor", "major"],
      defect_status: ["open", "in_work", "closed"],
      dvir_asset_type: ["vehicle", "trailer"],
      dvir_report_type: ["pre_trip", "post_trip"],
      dvir_status: [
        "draft",
        "submitted",
        "defects_found",
        "verified",
        "rejected",
      ],
      fuel_source: ["retail_station", "yard_tank", "mobile_vendor"],
      fuel_type: ["diesel", "gasoline", "off_road_diesel"],
      incident_severity: [
        "minor",
        "moderate",
        "major",
        "reportable",
        "near_miss",
      ],
      pm_target_type: ["vehicle", "trailer", "group"],
      product_type: [
        "standard_toilet",
        "ada_toilet",
        "deluxe_toilet",
        "high_rise_toilet",
        "handwashing_station_single",
        "handwashing_station_double",
        "restroom_trailer",
        "shower_trailer",
        "holding_tank",
        "urinal_stand",
        "sanitizer_stand",
        "accessories",
        "custom",
      ],
      work_order_priority: ["low", "normal", "high", "critical"],
      work_order_source: [
        "dvir_defect",
        "pm",
        "breakdown",
        "recall",
        "campaign",
        "other",
      ],
      work_order_status: [
        "open",
        "awaiting_parts",
        "in_progress",
        "vendor",
        "on_hold",
        "ready_for_verification",
        "completed",
        "canceled",
      ],
    },
  },
} as const
