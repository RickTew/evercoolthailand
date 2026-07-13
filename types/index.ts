export type ProjectStatus = '01' | '02' | '03' | '04'

export interface Stage {
  id: string
  name: string
  position: number
  color: string
  created_at: string
}

export interface Project {
  id: string
  number: string | null
  code: string
  name: string
  customer: string | null
  get_info_date: string | null
  current_stage_id: string | null
  status: ProjectStatus
  tq_number: string | null
  responsible_person: string | null
  quotation_sent_date: string | null
  follow_up_date: string | null
  notes: string | null
  quarter: string | null
  created_at: string
  updated_at: string
  // joined
  current_stage?: Stage | null
}

export interface StageLog {
  id: string
  project_id: string
  stage_id: string | null
  stage_name: string | null
  completed_date: string | null
  remark: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  display_name: string | null
  role: 'admin' | 'user'
  created_at: string
}

export interface Message {
  id: string
  thread_user_id: string
  sender_id: string
  sender_name: string | null
  body: string
  is_admin_reply: boolean
  read_by_admin: boolean
  read_by_user: boolean
  created_at: string
}

export const STATUS_LABELS_EN: Record<ProjectStatus, string> = {
  '01': 'Received',
  '02': 'In Process',
  '03': 'Win',
  '04': 'Fail',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  '01': '#3498DB',
  '02': '#F39C12',
  '03': '#2ECC71',
  '04': '#E74C3C',
}

export const STATUS_BG: Record<ProjectStatus, string> = {
  '01': 'bg-blue-500',
  '02': 'bg-yellow-500',
  '03': 'bg-green-500',
  '04': 'bg-red-500',
}

export interface ServiceRecord {
  id: string
  record_number: number | null
  project_name: string
  location: string | null
  department: string | null
  po_number: string | null
  unit_count: number | null
  visits_per_year: number | null
  first_visit_date: string | null
  due_date: string | null
  visit_schedule: string | null
  contractor_qt_number: string | null
  report_status: string | null
  invoice_end_user: string | null
  invoice_contractor: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentFilter {
  id: string
  location: string
  unit_name: string | null
  model: string | null
  model_number: string | null
  model_cdu_number: string | null
  pre_filter_sizing: string | null
  pre_filter_qty: number | null
  mid_filter_type: string | null
  mid_filter_sizing: string | null
  mid_filter_qty: number | null
  hepa_sizing: string | null
  hepa_qty: number | null
  unit_set_count: number | null
  created_at: string
}

export interface ServiceVisit {
  id: string
  service_record_id: string
  completed_date: string
  performed_by: string | null
  remarks: string | null
  created_at: string
}

export interface ServiceRecordEquipment {
  service_record_id: string
  equipment_filter_id: string
  created_at: string
}

export interface FilterInventory {
  id: string
  filter_type: string
  sizing: string | null
  current_stock: number
  low_stock_threshold: number
  notes: string | null
  created_at: string
  updated_at: string
}

// Returns the visit interval in days based on visits-per-year frequency
export const FREQUENCY_DAYS: Record<number, number> = {
  1: 360,
  2: 180,
  3: 120,
  4: 90,
}
