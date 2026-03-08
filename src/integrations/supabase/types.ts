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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          insight_type: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          insight_type: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          insight_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance_points: {
        Row: {
          created_at: string
          earned_at: string
          id: string
          points: number
          reason: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          earned_at?: string
          id?: string
          points: number
          reason?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          earned_at?: string
          id?: string
          points?: number
          reason?: string | null
          student_id?: string
        }
        Relationships: []
      }
      attendance_predictions: {
        Row: {
          actual_status: string | null
          created_at: string
          factors: Json | null
          id: string
          notification_sent: boolean | null
          predicted_date: string
          probability: number
          risk_level: string | null
          student_id: string
        }
        Insert: {
          actual_status?: string | null
          created_at?: string
          factors?: Json | null
          id?: string
          notification_sent?: boolean | null
          predicted_date: string
          probability: number
          risk_level?: string | null
          student_id: string
        }
        Update: {
          actual_status?: string | null
          created_at?: string
          factors?: Json | null
          id?: string
          notification_sent?: boolean | null
          predicted_date?: string
          probability?: number
          risk_level?: string | null
          student_id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          category: string | null
          confidence: number | null
          confidence_score: number | null
          created_at: string
          device_info: Json | null
          face_descriptor: Json | null
          id: string
          image_url: string | null
          status: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          confidence_score?: number | null
          created_at?: string
          device_info?: Json | null
          face_descriptor?: Json | null
          id?: string
          image_url?: string | null
          status?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          confidence_score?: number | null
          created_at?: string
          device_info?: Json | null
          face_descriptor?: Json | null
          id?: string
          image_url?: string | null
          status?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: string | null
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          badge_type?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          badge_type?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      bus_events: {
        Row: {
          bus_id: string | null
          created_at: string
          event_type: string
          id: string
          location: string | null
          parent_notified: boolean | null
          student_id: string
          timestamp: string
          verified_by: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          parent_notified?: boolean | null
          student_id: string
          timestamp?: string
          verified_by?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          parent_notified?: boolean | null
          student_id?: string
          timestamp?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_events_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          bus_number: string
          capacity: number | null
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          is_active: boolean | null
          route_name: string | null
        }
        Insert: {
          bus_number: string
          capacity?: number | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          route_name?: string | null
        }
        Update: {
          bus_number?: string
          capacity?: number | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          route_name?: string | null
        }
        Relationships: []
      }
      campus_zones: {
        Row: {
          allowed_categories: string[] | null
          camera_id: string | null
          created_at: string
          description: string | null
          id: string
          is_restricted: boolean | null
          name: string
          zone_type: string | null
        }
        Insert: {
          allowed_categories?: string[] | null
          camera_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          name: string
          zone_type?: string | null
        }
        Update: {
          allowed_categories?: string[] | null
          camera_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          name?: string
          zone_type?: string | null
        }
        Relationships: []
      }
      circulars: {
        Row: {
          acknowledgments_count: number | null
          attachment_url: string | null
          circular_type: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_urgent: boolean | null
          sent_at: string | null
          target_categories: string[] | null
          title: string
        }
        Insert: {
          acknowledgments_count?: number | null
          attachment_url?: string | null
          circular_type?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean | null
          sent_at?: string | null
          target_categories?: string[] | null
          title: string
        }
        Update: {
          acknowledgments_count?: number | null
          attachment_url?: string | null
          circular_type?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean | null
          sent_at?: string | null
          target_categories?: string[] | null
          title?: string
        }
        Relationships: []
      }
      class_leaderboard: {
        Row: {
          average_attendance: number | null
          category: string
          created_at: string
          id: string
          month_year: string
          rank: number | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          average_attendance?: number | null
          category: string
          created_at?: string
          id?: string
          month_year: string
          rank?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          average_attendance?: number | null
          category?: string
          created_at?: string
          id?: string
          month_year?: string
          rank?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      class_teachers: {
        Row: {
          category: string
          created_at: string
          id: string
          role: string
          subject_id: string | null
          teacher_name: string
          teacher_record_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          role?: string
          subject_id?: string | null
          teacher_name: string
          teacher_record_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          role?: string
          subject_id?: string | null
          teacher_name?: string
          teacher_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          trigger_method: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          trigger_method?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          trigger_method?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      emergency_responses: {
        Row: {
          created_at: string
          emergency_id: string | null
          id: string
          location: string | null
          notes: string | null
          responder_id: string
          response_time: string
          response_type: string | null
        }
        Insert: {
          created_at?: string
          emergency_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          responder_id: string
          response_time?: string
          response_type?: string | null
        }
        Update: {
          created_at?: string
          emergency_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          responder_id?: string
          response_time?: string
          response_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_responses_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_events"
            referencedColumns: ["id"]
          },
        ]
      }
      face_descriptors: {
        Row: {
          created_at: string
          descriptor: Json
          id: string
          image_url: string | null
          label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          descriptor: Json
          id?: string
          image_url?: string | null
          label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          descriptor?: Json
          id?: string
          image_url?: string | null
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gate_entries: {
        Row: {
          confidence: number | null
          created_at: string
          entry_time: string
          entry_type: string
          gate_name: string | null
          gate_session_id: string | null
          id: string
          is_recognized: boolean | null
          photo_url: string | null
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entry_time?: string
          entry_type?: string
          gate_name?: string | null
          gate_session_id?: string | null
          id?: string
          is_recognized?: boolean | null
          photo_url?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entry_time?: string
          entry_type?: string
          gate_name?: string | null
          gate_session_id?: string | null
          id?: string
          is_recognized?: boolean | null
          photo_url?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gate_entries_gate_session_id_fkey"
            columns: ["gate_session_id"]
            isOneToOne: false
            referencedRelation: "gate_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          ended_at: string | null
          gate_name: string
          id: string
          started_at: string
          started_by: string | null
          total_entries: number | null
          unknown_entries: number | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          ended_at?: string | null
          gate_name?: string
          id?: string
          started_at?: string
          started_by?: string | null
          total_entries?: number | null
          unknown_entries?: number | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          ended_at?: string | null
          gate_name?: string
          id?: string
          started_at?: string
          started_by?: string | null
          total_entries?: number | null
          unknown_entries?: number | null
        }
        Relationships: []
      }
      late_entries: {
        Row: {
          created_at: string
          entry_time: string
          id: string
          notes: string | null
          parent_notified: boolean | null
          photo_url: string | null
          reason: string
          reason_detail: string | null
          student_id: string
          student_name: string | null
        }
        Insert: {
          created_at?: string
          entry_time?: string
          id?: string
          notes?: string | null
          parent_notified?: boolean | null
          photo_url?: string | null
          reason?: string
          reason_detail?: string | null
          student_id: string
          student_name?: string | null
        }
        Update: {
          created_at?: string
          entry_time?: string
          id?: string
          notes?: string | null
          parent_notified?: boolean | null
          photo_url?: string | null
          reason?: string
          reason_detail?: string | null
          student_id?: string
          student_name?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          created_at: string
          gateway_response: Json | null
          id: string
          language: string | null
          message_content: string | null
          message_template: string | null
          notification_type: string | null
          recipient_id: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          gateway_response?: Json | null
          id?: string
          language?: string | null
          message_content?: string | null
          message_template?: string | null
          notification_type?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          gateway_response?: Json | null
          id?: string
          language?: string | null
          message_content?: string | null
          message_template?: string | null
          notification_type?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      period_timings: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_break: boolean
          label: string | null
          period_number: number
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_break?: boolean
          label?: string | null
          period_number: number
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_break?: boolean
          label?: string | null
          period_number?: number
          start_time?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      received_emails: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          received_at: string
          subject: string
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          received_at?: string
          subject?: string
          to_email?: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          received_at?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      school_gates: {
        Row: {
          camera_id: string | null
          created_at: string
          gate_type: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
        }
        Insert: {
          camera_id?: string | null
          created_at?: string
          gate_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
        }
        Update: {
          camera_id?: string | null
          created_at?: string
          gate_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      school_holidays: {
        Row: {
          academic_year: string | null
          created_at: string
          holiday_date: string
          holiday_type: string
          id: string
          is_half_day: boolean | null
          name: string
          name_hindi: string | null
          state: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          holiday_date: string
          holiday_type?: string
          id?: string
          is_half_day?: boolean | null
          name: string
          name_hindi?: string | null
          state?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          holiday_date?: string
          holiday_type?: string
          id?: string
          is_half_day?: boolean | null
          name?: string
          name_hindi?: string | null
          state?: string | null
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_id: string | null
          created_at: string
          earned_at: string
          id: string
          month_year: string | null
          student_id: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          earned_at?: string
          id?: string
          month_year?: string | null
          student_id: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          earned_at?: string
          id?: string
          month_year?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      substitutions: {
        Row: {
          absent_teacher_id: string
          absent_teacher_name: string
          auto_assigned: boolean
          category: string
          created_at: string
          date: string
          id: string
          period_number: number
          status: string
          subject_id: string | null
          substitute_teacher_id: string
          substitute_teacher_name: string
        }
        Insert: {
          absent_teacher_id: string
          absent_teacher_name: string
          auto_assigned?: boolean
          category: string
          created_at?: string
          date: string
          id?: string
          period_number: number
          status?: string
          subject_id?: string | null
          substitute_teacher_id: string
          substitute_teacher_name: string
        }
        Update: {
          absent_teacher_id?: string
          absent_teacher_name?: string
          auto_assigned?: boolean
          category?: string
          created_at?: string
          date?: string
          id?: string
          period_number?: number
          status?: string
          subject_id?: string | null
          substitute_teacher_id?: string
          substitute_teacher_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_permissions: {
        Row: {
          can_take_attendance: boolean | null
          can_view_reports: boolean | null
          category: string
          created_at: string
          granted_by: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_take_attendance?: boolean | null
          can_view_reports?: boolean | null
          category: string
          created_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_take_attendance?: boolean | null
          can_view_reports?: boolean | null
          category?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          category: string
          created_at: string
          day_of_week: number
          id: string
          period_number: number
          subject_id: string | null
          teacher_name: string
          teacher_record_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          day_of_week: number
          id?: string
          period_number: number
          subject_id?: string | null
          teacher_name: string
          teacher_record_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          day_of_week?: number
          id?: string
          period_number?: number
          subject_id?: string | null
          teacher_name?: string
          teacher_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          approved_by: string | null
          badge_code: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          email: string | null
          face_descriptor: Json | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          purpose: string
          status: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
          visiting_student_id: string | null
        }
        Insert: {
          approved_by?: string | null
          badge_code?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          email?: string | null
          face_descriptor?: Json | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          purpose: string
          status?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          visiting_student_id?: string | null
        }
        Update: {
          approved_by?: string | null
          badge_code?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          email?: string | null
          face_descriptor?: Json | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          purpose?: string
          status?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          visiting_student_id?: string | null
        }
        Relationships: []
      }
      wellness_scores: {
        Row: {
          attendance_score: number | null
          created_at: string
          emotion_score: number | null
          id: string
          intervention_needed: boolean | null
          notes: string | null
          overall_score: number | null
          punctuality_score: number | null
          score_date: string
          student_id: string
          trend: string | null
        }
        Insert: {
          attendance_score?: number | null
          created_at?: string
          emotion_score?: number | null
          id?: string
          intervention_needed?: boolean | null
          notes?: string | null
          overall_score?: number | null
          punctuality_score?: number | null
          score_date: string
          student_id: string
          trend?: string | null
        }
        Update: {
          attendance_score?: number | null
          created_at?: string
          emotion_score?: number | null
          id?: string
          intervention_needed?: boolean | null
          notes?: string | null
          overall_score?: number | null
          punctuality_score?: number | null
          score_date?: string
          student_id?: string
          trend?: string | null
        }
        Relationships: []
      }
      zone_entries: {
        Row: {
          alert_triggered: boolean | null
          created_at: string
          entry_time: string
          exit_time: string | null
          id: string
          is_authorized: boolean | null
          student_id: string
          zone_id: string | null
        }
        Insert: {
          alert_triggered?: boolean | null
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          is_authorized?: boolean | null
          student_id: string
          zone_id?: string | null
        }
        Update: {
          alert_triggered?: boolean | null
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          is_authorized?: boolean | null
          student_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_entries_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "campus_zones"
            referencedColumns: ["id"]
          },
        ]
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
    },
  },
} as const
