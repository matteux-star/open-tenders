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
      email_deliveries: {
        Row: {
          id: string
          organisation_id: string
          recipient_user_id: string | null
          recipient_email: string
          event_type: string
          event_key: string
          provider: string
          provider_message_id: string | null
          status: Database["public"]["Enums"]["email_delivery_status"]
          error_message: string | null
          metadata: Json
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          recipient_user_id?: string | null
          recipient_email: string
          event_type: string
          event_key: string
          provider?: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["email_delivery_status"]
          error_message?: string | null
          metadata?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          recipient_user_id?: string | null
          recipient_email?: string
          event_type?: string
          event_key?: string
          provider?: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["email_delivery_status"]
          error_message?: string | null
          metadata?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_deliveries_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_deliveries_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          id: string
          organisation_id: string
          channel: Database["public"]["Enums"]["notification_delivery_channel"]
          recipient_user_id: string | null
          recipient_address: string
          event_type: string
          event_key: string
          provider: string
          provider_message_id: string | null
          status: Database["public"]["Enums"]["email_delivery_status"]
          error_message: string | null
          metadata: Json
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          channel: Database["public"]["Enums"]["notification_delivery_channel"]
          recipient_user_id?: string | null
          recipient_address: string
          event_type: string
          event_key: string
          provider: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["email_delivery_status"]
          error_message?: string | null
          metadata?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          channel?: Database["public"]["Enums"]["notification_delivery_channel"]
          recipient_user_id?: string | null
          recipient_address?: string
          event_type?: string
          event_key?: string
          provider?: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["email_delivery_status"]
          error_message?: string | null
          metadata?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_links: {
        Row: {
          id: string
          user_id: string
          telegram_user_id: string
          telegram_chat_id: string
          telegram_username: string | null
          first_name: string | null
          last_name: string | null
          linked_at: string
          revoked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          telegram_user_id: string
          telegram_chat_id: string
          telegram_username?: string | null
          first_name?: string | null
          last_name?: string | null
          linked_at?: string
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          telegram_user_id?: string
          telegram_chat_id?: string
          telegram_username?: string | null
          first_name?: string | null
          last_name?: string | null
          linked_at?: string
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_tokens: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          expires_at: string
          consumed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          expires_at?: string
          consumed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_link_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          default_currency: string
          timezone: string
          seat_limit: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          default_currency?: string
          timezone?: string
          seat_limit?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          default_currency?: string
          timezone?: string
          seat_limit?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_invitations: {
        Row: {
          id: string
          organisation_id: string
          email: string
          role: Database["public"]["Enums"]["organisation_member_role"]
          message: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          invited_by: string | null
          accepted_by: string | null
          accepted_at: string | null
          token: string
          sent_at: string | null
          last_sent_error: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          email: string
          role?: Database["public"]["Enums"]["organisation_member_role"]
          message?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          token?: string
          sent_at?: string | null
          last_sent_error?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email?: string
          role?: Database["public"]["Enums"]["organisation_member_role"]
          message?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          token?: string
          sent_at?: string | null
          last_sent_error?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_access_requests: {
        Row: {
          id: string
          organisation_id: string
          requester_id: string
          requested_role: Database["public"]["Enums"]["organisation_member_role"]
          status: Database["public"]["Enums"]["settings_access_request_status"]
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          requester_id: string
          requested_role?: Database["public"]["Enums"]["organisation_member_role"]
          status?: Database["public"]["Enums"]["settings_access_request_status"]
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          requester_id?: string
          requested_role?: Database["public"]["Enums"]["organisation_member_role"]
          status?: Database["public"]["Enums"]["settings_access_request_status"]
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organisation_notification_settings: {
        Row: {
          organisation_id: string
          enabled_types: string[]
          reminder_days: number[]
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organisation_id: string
          enabled_types?: string[]
          reminder_days?: number[]
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          organisation_id?: string
          enabled_types?: string[]
          reminder_days?: number[]
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_notification_preferences: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          email_enabled: boolean
          telegram_enabled: boolean
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          email_enabled?: boolean
          telegram_enabled?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          user_id?: string
          email_enabled?: boolean
          telegram_enabled?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organisation_members: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          role: Database["public"]["Enums"]["organisation_member_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          role?: Database["public"]["Enums"]["organisation_member_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["organisation_member_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          id: string
          organisation_id: string
          title: string
          buyer_name: string
          sector: string | null
          region: string | null
          estimated_value: number | null
          currency: string
          owner_id: string | null
          stage: Database["public"]["Enums"]["tender_stage"]
          status: Database["public"]["Enums"]["tender_status"]
          submission_deadline: string | null
          psq_due_at: string | null
          itt_due_at: string | null
          final_clarification_deadline: string | null
          published_at: string | null
          source_url: string | null
          notes: string | null
          closed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          title: string
          buyer_name: string
          sector?: string | null
          region?: string | null
          estimated_value?: number | null
          currency?: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["tender_stage"]
          status?: Database["public"]["Enums"]["tender_status"]
          submission_deadline?: string | null
          psq_due_at?: string | null
          itt_due_at?: string | null
          final_clarification_deadline?: string | null
          published_at?: string | null
          source_url?: string | null
          notes?: string | null
          closed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          title?: string
          buyer_name?: string
          sector?: string | null
          region?: string | null
          estimated_value?: number | null
          currency?: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["tender_stage"]
          status?: Database["public"]["Enums"]["tender_status"]
          submission_deadline?: string | null
          psq_due_at?: string | null
          itt_due_at?: string | null
          final_clarification_deadline?: string | null
          published_at?: string | null
          source_url?: string | null
          notes?: string | null
          closed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_stage_history: {
        Row: {
          id: string
          tender_id: string
          organisation_id: string
          from_stage: Database["public"]["Enums"]["tender_stage"] | null
          to_stage: Database["public"]["Enums"]["tender_stage"]
          changed_by: string | null
          changed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          tender_id: string
          organisation_id: string
          from_stage?: Database["public"]["Enums"]["tender_stage"] | null
          to_stage: Database["public"]["Enums"]["tender_stage"]
          changed_by?: string | null
          changed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          tender_id?: string
          organisation_id?: string
          from_stage?: Database["public"]["Enums"]["tender_stage"] | null
          to_stage?: Database["public"]["Enums"]["tender_stage"]
          changed_by?: string | null
          changed_at?: string
          notes?: string | null
        }
        Relationships: []
      }
      tender_deadlines: {
        Row: {
          id: string
          tender_id: string
          organisation_id: string
          title: string
          deadline_type: Database["public"]["Enums"]["tender_deadline_type"]
          due_at: string
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tender_id: string
          organisation_id: string
          title: string
          deadline_type: Database["public"]["Enums"]["tender_deadline_type"]
          due_at: string
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tender_id?: string
          organisation_id?: string
          title?: string
          deadline_type?: Database["public"]["Enums"]["tender_deadline_type"]
          due_at?: string
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_activity: {
        Row: {
          id: string
          tender_id: string | null
          organisation_id: string
          actor_id: string | null
          event_type: string
          message: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tender_id?: string | null
          organisation_id: string
          actor_id?: string | null
          event_type: string
          message: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tender_id?: string | null
          organisation_id?: string
          actor_id?: string | null
          event_type?: string
          message?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          organisation_id: string
          tender_id: string | null
          client_name: string
          contract_name: string
          value: number | null
          currency: string
          start_date: string | null
          end_date: string | null
          renewal_window_start: string | null
          status: Database["public"]["Enums"]["contract_status"]
          owner_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          tender_id?: string | null
          client_name: string
          contract_name: string
          value?: number | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          renewal_window_start?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          owner_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          tender_id?: string | null
          client_name?: string
          contract_name?: string
          value?: number | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          renewal_window_start?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          owner_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organisation: {
        Args: {
          organisation_name: string
          organisation_slug: string
        }
        Returns: Database["public"]["Tables"]["organisations"]["Row"]
      }
      has_org_role: {
        Args: {
          target_organisation_id: string
          allowed_roles: Database["public"]["Enums"]["organisation_member_role"][]
        }
        Returns: boolean
      }
      is_org_member: {
        Args: {
          target_organisation_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      email_delivery_status: "pending" | "sent" | "failed" | "skipped"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      notification_delivery_channel: "email" | "telegram"
      organisation_member_role: "admin" | "editor" | "viewer"
      settings_access_request_status: "pending" | "approved" | "rejected"
      tender_stage:
        | "identified"
        | "psq"
        | "itt"
        | "submitted"
        | "presentation"
        | "award"
        | "standstill"
        | "won"
        | "lost"
        | "withdrawn"
        | "no_bid"
      tender_status:
        | "on_track"
        | "at_risk"
        | "blocked"
        | "urgent"
        | "submitted"
        | "awaiting_result"
        | "closed"
      tender_deadline_type:
        | "submission"
        | "clarification"
        | "internal_review"
        | "site_visit"
        | "presentation"
        | "standstill"
        | "award"
        | "renewal"
      contract_status: "active" | "renewal_watch" | "rebid" | "ended"
    }
    CompositeTypes: Record<string, never>
  }
}
