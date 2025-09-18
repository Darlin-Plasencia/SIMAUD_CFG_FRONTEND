/*
  # Fix SQL syntax error and create proper approval policies

  1. Security
    - Drop existing policies cleanly
    - Create new policies with correct syntax
    - Enable proper permissions for supervisors

  2. Changes
    - Remove IF NOT EXISTS from CREATE POLICY (not supported in older PostgreSQL)
    - Clean policy creation without syntax errors
    - Proper RLS for approvals workflow
*/

-- Drop existing policies safely
DROP POLICY IF EXISTS "contract_approvals_supervisors_read" ON contract_approvals;
DROP POLICY IF EXISTS "contract_approvals_supervisors_update" ON contract_approvals;
DROP POLICY IF EXISTS "contract_approvals_users_read" ON contract_approvals;
DROP POLICY IF EXISTS "contract_approvals_users_insert" ON contract_approvals;
DROP POLICY IF EXISTS "contracts_supervisors_read" ON contracts;
DROP POLICY IF EXISTS "contracts_supervisors_update" ON contracts;

-- Contract Approvals policies
CREATE POLICY "supervisors_read_all_approvals" 
ON contract_approvals 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "supervisors_update_approvals" 
ON contract_approvals 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "users_read_own_approvals" 
ON contract_approvals 
FOR SELECT 
TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "users_create_approvals" 
ON contract_approvals 
FOR INSERT 
TO authenticated
WITH CHECK (requested_by = auth.uid());

-- Contracts policies for supervisors
CREATE POLICY "supervisors_read_contracts" 
ON contracts 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "supervisors_update_contracts" 
ON contracts 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'supervisor')
  )
);

-- Service role access
CREATE POLICY "service_role_approvals_all" 
ON contract_approvals 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_contracts_all" 
ON contracts 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create approval records for existing pending contracts
INSERT INTO contract_approvals (contract_id, version_number, requested_by, status)
SELECT 
  c.id,
  c.current_version,
  c.created_by,
  'pending'
FROM contracts c
WHERE c.approval_status = 'pending_approval'
AND NOT EXISTS (
  SELECT 1 FROM contract_approvals ca 
  WHERE ca.contract_id = c.id 
  AND ca.status = 'pending'
);