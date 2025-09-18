@@ .. @@
 -- Función para obtener estadísticas de firmante
+DROP FUNCTION IF EXISTS get_signatory_contracts_stats(uuid);
+
 CREATE OR REPLACE FUNCTION get_signatory_contracts_stats(user_uuid uuid)
 RETURNS TABLE(
   pending_signature bigint,
   signed bigint,
   active bigint,
   expired bigint
 ) AS $$
 BEGIN
   RETURN QUERY
   SELECT 
     COUNT(*) FILTER (WHERE cs.status = 'pending' AND c.approval_status IN ('approved', 'signed', 'completed') AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)) as pending_signature,
     COUNT(*) FILTER (WHERE cs.status = 'signed') as signed,
     COUNT(*) FILTER (WHERE cs.status = 'signed' AND c.status = 'active' AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)) as active,
     COUNT(*) FILTER (WHERE c.end_date IS NOT NULL AND c.end_date < CURRENT_DATE) as expired
   FROM contract_signatories cs
   JOIN contracts c ON c.id = cs.contract_id
   WHERE cs.user_id = user_uuid OR cs.email = (
     SELECT email FROM user_profiles WHERE id = user_uuid
   );
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;