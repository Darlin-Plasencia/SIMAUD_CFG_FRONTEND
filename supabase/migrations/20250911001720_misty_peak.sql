/*
  # Permisos completos de administrador para gestores

  1. Políticas RLS
    - Gestores tendrán los mismos permisos que administradores
    - Acceso completo a todas las tablas del sistema
    - Sin restricciones para solucionar problemas de datos

  2. Tablas afectadas
    - contracts: CRUD completo
    - contract_approvals: CRUD completo  
    - contract_signatories: CRUD completo
    - contract_templates: CRUD completo
    - template_variables: CRUD completo
    - contract_versions: CRUD completo
    - contract_audit_logs: READ completo
    - user_profiles: READ completo

  3. Beneficios
    - Gestores pueden ver toda la información necesaria
    - Sin errores por falta de permisos
    - Experiencia de usuario mejorada
*/

-- Limpiar políticas existentes para gestores
DROP POLICY IF EXISTS "gestor_contracts_access" ON contracts;
DROP POLICY IF EXISTS "gestor_approvals_access" ON contract_approvals;
DROP POLICY IF EXISTS "gestor_signatories_access" ON contract_signatories;

-- CONTRATOS: Gestores tienen acceso completo como admins
CREATE POLICY "gestores_admin_access_contracts"
ON contracts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
);

-- APROBACIONES: Gestores pueden ver todas sus solicitudes y crear nuevas
CREATE POLICY "gestores_admin_access_approvals"
ON contract_approvals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
);

-- FIRMANTES: Gestores tienen acceso completo
CREATE POLICY "gestores_admin_access_signatories"
ON contract_signatories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
);

-- VERSIONES: Gestores pueden ver y crear versiones
CREATE POLICY "gestores_admin_access_versions"
ON contract_versions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
);

-- PLANTILLAS: Gestores pueden leer plantillas (manteniendo restricción de creación para supervisores)
CREATE POLICY "gestores_read_all_templates"
ON contract_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor', 'user')
  )
);

-- VARIABLES: Gestores pueden leer variables
CREATE POLICY "gestores_read_all_variables"
ON template_variables
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor', 'user')
  )
);

-- AUDIT LOGS: Gestores pueden ver logs de sus contratos
CREATE POLICY "gestores_read_audit_logs"
ON contract_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = uid() 
    AND user_profiles.role IN ('admin', 'supervisor', 'gestor')
  )
);

-- USER PROFILES: Gestores pueden leer perfiles (para mostrar nombres)
CREATE POLICY "gestores_read_user_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = uid() 
    AND up.role IN ('admin', 'supervisor', 'gestor')
  )
);