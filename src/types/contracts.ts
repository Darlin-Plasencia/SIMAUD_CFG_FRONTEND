export interface Contract {
  id: string;
  template_id: string | null;
  title: string;
  content: string;
  variables_data: Record<string, any>;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'signed' | 'completed';
  current_version: number;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  generated_content: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractSignatory {
  id: string;
  contract_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'client' | 'witness' | 'contractor';
  signing_order: number;
  signed_at: string | null;
  signature_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  content: string;
  variables_data: Record<string, any>;
  created_by: string | null;
  created_at: string;
  change_summary: string | null;
}

export interface ContractApproval {
  id: string;
  contract_id: string;
  version_number: number;
  requested_by: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  created_at: string;
}

export interface ContractAuditLog {
  id: string;
  contract_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  variables: string[];
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea';
  options: string[] | null;
  required: boolean;
  description: string;
}

export interface ContractFormData {
  template_id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  variables_data: Record<string, any>;
  signatories: Omit<ContractSignatory, 'id' | 'contract_id' | 'created_at' | 'updated_at' | 'signed_at' | 'signature_url' | 'ip_address' | 'user_agent'>[];
}