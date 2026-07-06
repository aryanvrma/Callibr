// This file mirrors the output of:
//   supabase gen types typescript --project-id <your-project-id> > database.types.ts
//
// Run that command against your real Supabase project once the migration
// above has been applied — this hand-written version matches its shape
// so Person 2 can start building against real types immediately.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VerificationStatus =
  | 'pending'
  | 'dialing'
  | 'in_progress'
  | 'needs_retry'
  | 'escalated'
  | 'verified'
  | 'failed'

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          company_name: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employers: {
        Row: {
          id: string
          name: string
          hr_contact_name: string | null
          hr_contact_phone: string | null
          hr_contact_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          hr_contact_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          hr_contact_email?: string | null
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          created_at?: string
        }
      }
      verification_cases: {
        Row: {
          id: string
          client_id: string
          candidate_id: string
          employer_id: string | null
          status: VerificationStatus
          check_type: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          candidate_id: string
          employer_id?: string | null
          status?: VerificationStatus
          check_type?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          candidate_id?: string
          employer_id?: string | null
          status?: VerificationStatus
          check_type?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          case_id: string
          call_provider: string | null
          call_sid: string | null
          transcript: string | null
          extracted_data: Json | null
          outcome: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          call_provider?: string | null
          call_sid?: string | null
          transcript?: string | null
          extracted_data?: Json | null
          outcome?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          call_provider?: string | null
          call_sid?: string | null
          transcript?: string | null
          extracted_data?: Json | null
          outcome?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      verification_status: VerificationStatus
    }
  }
}

// Convenience row-level type aliases for use across the app
export type Client = Database['public']['Tables']['clients']['Row']
export type Employer = Database['public']['Tables']['employers']['Row']
export type Candidate = Database['public']['Tables']['candidates']['Row']
export type VerificationCase = Database['public']['Tables']['verification_cases']['Row']
export type CallLog = Database['public']['Tables']['call_logs']['Row']