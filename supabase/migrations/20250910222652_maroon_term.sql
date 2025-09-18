/*
  # Mejorar vinculación de firmantes con usuarios

  1. Funcionalidad
    - Función para vincular automáticamente firmantes por email
    - Trigger para vincular al crear/actualizar firmantes
    - Mejores políticas para visibilidad de contratos

  2. Seguridad
    - RLS policies actualizadas
    - Verificación de permisos
*/

-- Función para vincular firmantes con usuarios por email
CREATE OR REPLACE FUNCTION link_signatories_to_users()
RETURNS trigger AS $$
BEGIN
  -- Intentar encontrar usuario con el mismo email
  IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    UPDATE contract_signatories 
    SET user_id = (
      SELECT id FROM user_profiles 
      WHERE email = NEW.email 
      LIMIT 1
    )
    WHERE id = NEW.id 
    AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para vincular automáticamente al insertar/actualizar firmantes
DROP TRIGGER IF EXISTS auto_link_signatories_trigger ON contract_signatories;
CREATE TRIGGER auto_link_signatories_trigger
  AFTER INSERT OR UPDATE ON contract_signatories
  FOR EACH ROW
  EXECUTE FUNCTION link_signatories_to_users();

-- Función para vincular firmantes existentes cuando se crea un usuario
CREATE OR REPLACE FUNCTION link_existing_signatories_on_user_creation()
RETURNS trigger AS $$
BEGIN
  -- Vincular firmantes existentes con el mismo email
  UPDATE contract_signatories 
  SET user_id = NEW.id
  WHERE email = NEW.email 
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para vincular firmantes existentes al crear usuario
DROP TRIGGER IF EXISTS link_signatories_on_user_creation_trigger ON user_profiles;
CREATE TRIGGER link_signatories_on_user_creation_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_existing_signatories_on_user_creation();

-- Mejorar políticas para firmantes
DROP POLICY IF EXISTS "Signatories can view their own signing info" ON contract_signatories;
CREATE POLICY "Signatories can view their own signing info"
  ON contract_signatories
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (email = (SELECT email FROM user_profiles WHERE id = auth.uid())) OR
    (EXISTS (
      SELECT 1 FROM contracts c 
      WHERE c.id = contract_signatories.contract_id 
      AND c.approval_status IN ('approved', 'signed', 'completed')
    ))
  );

-- Política para que firmantes puedan actualizar su estado de firma
DROP POLICY IF EXISTS "Signatories can update their signing status" ON contract_signatories;
CREATE POLICY "Signatories can update their signing status"
  ON contract_signatories
  FOR UPDATE
  TO authenticated
  USING (
    ((user_id = auth.uid()) OR (email = (SELECT email FROM user_profiles WHERE id = auth.uid())))
    AND (EXISTS (
      SELECT 1 FROM contracts c 
      WHERE c.id = contract_signatories.contract_id 
      AND c.approval_status = 'approved'
    ))
  )
  WITH CHECK (
    ((user_id = auth.uid()) OR (email = (SELECT email FROM user_profiles WHERE id = auth.uid())))
    AND (EXISTS (
      SELECT 1 FROM contracts c 
      WHERE c.id = contract_signatories.contract_id 
      AND c.approval_status = 'approved'
    ))
  );

-- Función helper para obtener estadísticas de firmante (ya no necesaria con el nuevo enfoque)
-- Se mantiene por compatibilidad pero no se usa
CREATE OR REPLACE FUNCTION get_signatory_contracts_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'pending_signature', 
    COUNT(*) FILTER (WHERE cs.status = 'pending' AND c.approval_status = 'approved'),
    'signed', 
    COUNT(*) FILTER (WHERE cs.status = 'signed'),
    'active', 
    COUNT(*) FILTER (WHERE cs.status = 'signed' AND c.status = 'active'),
    'expired', 
    COUNT(*) FILTER (WHERE c.end_date < CURRENT_DATE)
  ) INTO stats
  FROM contract_signatories cs
  JOIN contracts c ON c.id = cs.contract_id
  WHERE (cs.user_id = user_uuid OR cs.email = (SELECT email FROM user_profiles WHERE id = user_uuid))
  AND c.approval_status IN ('approved', 'signed', 'completed');
  
  RETURN COALESCE(stats, '{"pending_signature":0,"signed":0,"active":0,"expired":0}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;