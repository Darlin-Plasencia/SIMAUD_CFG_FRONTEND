/*
  # Fix supervisor approval permissions and data visibility

  1. Permissions
    - Ensure supervisors can read all approvals
    - Ensure supervisors can read all contracts
    - Ensure supervisors can update approvals
    - Ensure supervisors can update contracts

  2. Data Integrity
    - Verify approval records exist for pending contracts
    - Fix any missing approval records

  3. Functions
    - Ensure auto-approval creation works properly
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "supervisors_read_all_approvals" ON contract_approvals;
DROP POLICY IF EXISTS "supervisors_and_admins_read_all_approvals" ON contract_approvals;
DROP POLICY IF EXISTS "supervisors_update_approvals" ON contract_approvals;
DROP POLICY IF EXISTS "supervisors_and_admins_update_approvals" ON contract_approvals;

-- Simple and clear policies for contract_approvals
CREATE POLICY "approval_supervisors_read_all" 
ON contract_approvals FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "approval_supervisors_update" 
ON contract_approvals FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "approval_gestors_read_own" 
ON contract_approvals FOR SELECT 
TO authenticated 
USING (requested_by = auth.uid());

CREATE POLICY "approval_gestors_create" 
ON contract_approvals FOR INSERT 
TO authenticated 
WITH CHECK (requested_by = auth.uid());

-- Ensure contracts can be read by supervisors for the join
CREATE POLICY IF NOT EXISTS "contracts_supervisors_read" 
ON contracts FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- Ensure contracts can be updated by supervisors
CREATE POLICY IF NOT EXISTS "contracts_supervisors_update" 
ON contracts FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- Create missing approval records for existing pending contracts
INSERT INTO contract_approvals (
  contract_id,
  version_number,
  requested_by,
  requested_at,
  status,
  comments
)
SELECT 
  c.id,
  COALESCE(c.current_version, 1),
  c.created_by,
  COALESCE(c.updated_at, c.created_at),
  'pending',
  'Auto-generated approval request for existing pending contract'
FROM contracts c
WHERE c.approval_status = 'pending_approval'
AND NOT EXISTS (
  SELECT 1 FROM contract_approvals ca 
  WHERE ca.contract_id = c.id 
  AND ca.status = 'pending'
);

-- Ensure the auto-approval trigger exists and works
CREATE OR REPLACE FUNCTION create_approval_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create approval when status changes TO pending_approval
  IF OLD.approval_status != 'pending_approval' AND NEW.approval_status = 'pending_approval' THEN
    INSERT INTO contract_approvals (
      contract_id,
      version_number,
      requested_by,
      requested_at,
      status,
      comments
    ) VALUES (
      NEW.id,
      COALESCE(NEW.current_version, 1),
      NEW.created_by,
      NOW(),
      'pending',
      'Automatic approval request created'
    );
    
    -- Log the creation for debugging
    RAISE NOTICE 'Created approval request for contract %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS auto_create_approval_request ON contracts;
CREATE TRIGGER auto_create_approval_request
  AFTER UPDATE OF approval_status ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_request();

-- Grant necessary permissions
GRANT SELECT ON contract_approvals TO authenticated;
GRANT UPDATE ON contract_approvals TO authenticated;
GRANT SELECT ON contracts TO authenticated;
GRANT UPDATE ON contracts TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;