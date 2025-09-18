import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Save, 
  Eye, 
  Code, 
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  Contract, 
  ContractTemplate, 
  TemplateVariable, 
  ContractFormData,
  ContractSignatory 
} from '../../types/contracts';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  isEditMode: boolean;
  onSuccess: () => void;
  auto_renewal: boolean;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  isEditMode,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  const [formData, setFormData] = useState<ContractFormData>({
    template_id: '',
    title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    contract_value: null,
    start_date: null,
    end_date: null,
    notes: '',
    variables_data: {},
    signatories: [],
    auto_renewal: false
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      
      console.log('🔄 Modal opened with:', { 
        isEditMode, 
        hasContract: !!contract, 
        contractId: contract?.id,
        contractTitle: contract?.title 
      });
      
      // Resetear formulario si es modo crear
      if (!isEditMode || !contract) {
        console.log('🆕 CREATE MODE: Resetting form');
        setFormData({
          template_id: '',
          title: '',
          client_name: '',
          client_email: '',
          client_phone: '',
          contract_value: null,
          start_date: null,
          end_date: null,
          notes: '',
          variables_data: {},
          signatories: []
        });
      }
      
      if (contract && isEditMode) {
        console.log('✏️ EDIT MODE: Loading contract data...');
        // Usar setTimeout para asegurar que el estado se haya actualizado
        setTimeout(() => {
          loadContractData();
        }, 100);
      }
    }
  }, [isOpen, contract, isEditMode]);

  useEffect(() => {
    if (formData.template_id) {
      loadTemplateData(formData.template_id);
    }
  }, [formData.template_id]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadContractData = async () => {
    if (!contract) return;
    
    console.log('🔄 EDITING MODE: Loading contract data for:', contract.id);
    console.log('📋 Contract title:', contract.title);
    console.log('📋 Contract template_id:', contract.template_id);
    console.log('📋 Contract client:', contract.client_name);
    console.log('📋 Contract value:', contract.contract_value);
    
    try {
      // Cargar firmantes
      const { data: signatories, error: signatoriesError } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contract.id);

      if (signatoriesError) throw signatoriesError;

      console.log('👥 Loaded signatories:', signatories);
      
      // Preparar datos de firmantes
      const formattedSignatories = (signatories || []).map(s => ({
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        role: s.role,
        signing_order: s.signing_order
      }));

      console.log('👥 Formatted signatories:', formattedSignatories);
      
      // Setear datos del formulario con verificación
      setFormData({
        template_id: contract.template_id || '',
        title: contract.title || '',
        client_name: contract.client_name || '',
        client_email: contract.client_email || '',
        client_phone: contract.client_phone || '',
        contract_value: contract.contract_value || null,
        start_date: contract.start_date || null,
        end_date: contract.end_date || null,
        notes: contract.notes || '',
        variables_data: contract.variables_data || {},
        signatories: formattedSignatories,
        auto_renewal: contract.auto_renewal || false
      });
      
      console.log('✅ Form data set successfully');
      console.log('📊 Final form data:', {
        template_id: contract.template_id,
        title: contract.title,
        client_name: contract.client_name,
        signatories_count: formattedSignatories.length
      });
      
      // Cargar datos de plantilla si existe template_id
      if (contract.template_id) {
        console.log('🔄 Loading template data for:', contract.template_id);
        await loadTemplateData(contract.template_id);
      }
      
    } catch (error) {
      console.error('Error loading contract data:', error);
      setError('Error al cargar los datos del contrato');
    }
  };

  const loadTemplateData = async (templateId: string) => {
    if (!templateId) return;
    
    console.log('📄 Loading template data for ID:', templateId);
    
    try {
      const { data: template, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      
      console.log('📄 Template loaded successfully:', template?.title);
      setSelectedTemplate(template);

      if (template.variables && template.variables.length > 0) {
        console.log('🔧 Loading variables for template:', template.variables);
        const { data: variables, error: variablesError } = await supabase
          .from('template_variables')
          .select('*')
          .in('name', template.variables);

        if (variablesError) throw variablesError;
        setTemplateVariables(variables || []);
        console.log('🔧 Template variables loaded successfully:', variables?.length || 0);
      } else {
        setTemplateVariables([]);
        console.log('🔧 No variables for this template');
      }
    } catch (error) {
      console.error('Error loading template data:', error);
      setError('Error al cargar los datos de la plantilla');
    }
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;

    let preview = selectedTemplate.content;
    
    // Reemplazar variables con valores del formulario
    templateVariables.forEach(variable => {
      const value = formData.variables_data[variable.name] || `[${variable.label}]`;
      preview = preview.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    });
    
    setPreviewContent(preview);
  };

  const validateForm = () => {
    if (!formData.template_id) return 'Debe seleccionar una plantilla';
    if (!formData.title.trim()) return 'El título es requerido';
    if (!formData.client_name.trim()) return 'El nombre del cliente es requerido';
    if (!formData.client_email.trim()) return 'El email del cliente es requerido';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.client_email)) return 'Email del cliente inválido';
    
    // Validar variables requeridas
    const missingVariables = templateVariables
      .filter(v => v.required && !formData.variables_data[v.name])
      .map(v => v.label);
    
    if (missingVariables.length > 0) {
      return `Faltan variables requeridas: ${missingVariables.join(', ')}`;
    }
    
    // Validar firmantes
    if (formData.signatories.length === 0) {
      return 'Debe agregar al menos un firmante';
    }
    
    for (const signatory of formData.signatories) {
      if (!signatory.name.trim()) return 'Todos los firmantes deben tener nombre';
      if (!signatory.email.trim()) return 'Todos los firmantes deben tener email';
      if (!emailRegex.test(signatory.email)) return 'Email de firmante inválido';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      generatePreview();
      
      if (isEditMode && contract) {
        await handleUpdateContract();
      } else {
        await handleCreateContract();
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!user) throw new Error('Usuario no autenticado');

    // Crear el contrato
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert({
        template_id: formData.template_id,
        title: formData.title,
        content: selectedTemplate?.content || '',
        variables_data: formData.variables_data,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        contract_value: formData.contract_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes,
        status: 'draft',
        approval_status: 'draft',
        created_by: user.id,
        generated_content: previewContent,
        auto_renewal: formData.auto_renewal,
        renewal_type: 'original',
        actual_status: 'draft'
      })
      .select()
      .single();

    if (contractError) throw contractError;

    // Crear firmantes
    const signatoriesToInsert = formData.signatories.map(signatory => ({
      contract_id: contractData.id,
      status: 'pending',
      ...signatory
    }));

    const { error: signatoriesError } = await supabase
      .from('contract_signatories')
      .insert(signatoriesToInsert);

    if (signatoriesError) throw signatoriesError;

    // Intentar vincular firmantes con usuarios existentes
    for (const signatory of formData.signatories) {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', signatory.email)
        .single();
      
      if (userData) {
        await supabase
          .from('contract_signatories')
          .update({ user_id: userData.id })
          .eq('contract_id', contractData.id)
          .eq('email', signatory.email);
      }
    }
    // Crear primera versión
    const { error: versionError } = await supabase
      .from('contract_versions')
      .insert({
        contract_id: contractData.id,
        version_number: 1,
        content: selectedTemplate?.content || '',
        variables_data: formData.variables_data,
        created_by: user.id,
        change_summary: 'Versión inicial del contrato'
      });

    if (versionError) throw versionError;

    console.log('Contrato creado exitosamente');
  };

  const handleUpdateContract = async () => {
    if (!contract) return;

    console.log('🔄 Updating contract:', contract.id);
    
    // Si el contrato fue rechazado y se está actualizando, preparar para reenvío
    const wasRejected = contract.approval_status === 'rejected';
    const newVersion = wasRejected ? (contract.current_version || 1) + 1 : (contract.current_version || 1);

    console.log('📋 Update info:', { 
      wasRejected, 
      newVersion, 
      currentVersion: contract.current_version,
      willRequestApproval: wasRejected 
    });

    // Generar contenido procesado antes de actualizar
    generatePreview();

    const { error: contractError } = await supabase
      .from('contracts')
      .update({
        title: formData.title,
        variables_data: formData.variables_data,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        contract_value: formData.contract_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes,
        generated_content: previewContent,
        auto_renewal: formData.auto_renewal,
        updated_at: new Date().toISOString(),
        ...(wasRejected && {
          approval_status: 'pending_approval',
          current_version: newVersion,
          rejection_reason: null
        })
      })
      .eq('id', contract.id);

    if (contractError) throw contractError;
    
    console.log('✅ Contract updated successfully');

    // Si fue rechazado, crear nueva versión y solicitud de aprobación
    if (wasRejected) {
      console.log('🔄 Creating new version and approval request...');
      
      // Crear nueva versión
      const { error: versionError } = await supabase
        .from('contract_versions')
        .insert({
          contract_id: contract.id,
          version_number: newVersion,
          content: selectedTemplate?.content || contract.content,
          variables_data: formData.variables_data,
          created_by: user.id,
          change_summary: 'Correcciones después del rechazo - Reenvío para aprobación'
        });

      if (versionError) throw versionError;
      console.log('✅ New version created');

      // NOTE: La solicitud de aprobación se crea automáticamente por el trigger
      console.log('✅ Approval request will be created automatically by trigger');
    }

    // Actualizar firmantes (eliminar existentes y crear nuevos)
    console.log('🔄 Updating signatories...');
    
    const { error: deleteError } = await supabase
      .from('contract_signatories')
      .delete()
      .eq('contract_id', contract.id);

    if (deleteError) throw deleteError;
    console.log('✅ Old signatories deleted');

    const signatoriesToInsert = formData.signatories.map(signatory => ({
      contract_id: contract.id,
      status: 'pending',
      ...signatory
    }));

    console.log('👥 Inserting new signatories:', signatoriesToInsert);
    const { error: signatoriesError } = await supabase
      .from('contract_signatories')
      .insert(signatoriesToInsert);

    if (signatoriesError) throw signatoriesError;
    console.log('✅ New signatories created');

    // Vincular firmantes con usuarios existentes después de actualizar
    for (const signatory of formData.signatories) {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', signatory.email)
        .single();
      
      if (userData) {
        const { error: updateError } = await supabase
          .from('contract_signatories')
          .update({ user_id: userData.id })
          .eq('contract_id', contract.id)
          .eq('email', signatory.email);
        
        if (updateError) console.warn('Could not link signatory to user:', updateError);
      }
    }
    
    console.log('✅ Contract updated successfully');
  };

  const handleInputChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables_data: { ...prev.variables_data, [variableName]: value }
    }));
  };

  const addSignatory = () => {
    setFormData(prev => ({
      ...prev,
      signatories: [...prev.signatories, {
        name: '',
        email: '',
        phone: '',
        role: 'client',
        signing_order: prev.signatories.length + 1
      }]
    }));
  };

  const removeSignatory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signatories: prev.signatories.filter((_, i) => i !== index)
    }));
  };

  const updateSignatory = (index: number, field: keyof ContractSignatory, value: any) => {
    setFormData(prev => ({
      ...prev,
      signatories: prev.signatories.map((signatory, i) =>
        i === index ? { ...signatory, [field]: value } : signatory
      )
    }));
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode ? 'Editar Contrato' : 'Nuevo Contrato';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Modifica los datos del contrato' : 'Crea un nuevo contrato basado en una plantilla'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => {
                  generatePreview();
                  setShowPreview(!showPreview);
                }}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{showPreview ? 'Formulario' : 'Vista Previa'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex max-h-[calc(90vh-120px)]">
          {!showPreview ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Selection */}
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plantilla de Contrato *
                    </label>
                    <select
                      value={formData.template_id}
                      onChange={(e) => handleInputChange('template_id', e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                      required
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título del Contrato *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Contrato de Servicios - Cliente ABC"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor del Contrato
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.contract_value || ''}
                        onChange={(e) => handleInputChange('contract_value', e.target.value ? parseFloat(e.target.value) : null)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Información del Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.client_name}
                          onChange={(e) => handleInputChange('client_name', e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Juan Pérez"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => handleInputChange('client_email', e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="juan@email.com"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          value={formData.client_phone}
                          onChange={(e) => handleInputChange('client_phone', e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1234567890"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => handleInputChange('start_date', e.target.value || null)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => handleInputChange('end_date', e.target.value || null)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Template Variables */}
                {templateVariables.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Variables de la Plantilla</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templateVariables.map(variable => (
                        <div key={variable.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {variable.label} {variable.required && '*'}
                          </label>
                          {variable.type === 'textarea' ? (
                            <textarea
                              value={formData.variables_data[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              rows={3}
                              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={variable.description || `Ingresa ${variable.label.toLowerCase()}`}
                              required={variable.required}
                              disabled={loading}
                            />
                          ) : variable.type === 'select' ? (
                            <select
                              value={formData.variables_data[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required={variable.required}
                              disabled={loading}
                            >
                              <option value="">Seleccionar...</option>
                              {variable.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={variable.type}
                              value={formData.variables_data[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={variable.description || `Ingresa ${variable.label.toLowerCase()}`}
                              required={variable.required}
                              disabled={loading}
                            />
                          )}
                          {variable.description && (
                            <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatories */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">Firmantes del Contrato</h4>
                    <button
                      type="button"
                      onClick={addSignatory}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Agregar Firmante</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.signatories.map((signatory, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Firmante {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeSignatory(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <input
                              type="text"
                              value={signatory.name}
                              onChange={(e) => updateSignatory(index, 'name', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nombre completo"
                              required
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <input
                              type="email"
                              value={signatory.email}
                              onChange={(e) => updateSignatory(index, 'email', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Email"
                              required
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <input
                              type="tel"
                              value={signatory.phone || ''}
                              onChange={(e) => updateSignatory(index, 'phone', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Teléfono"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <select
                              value={signatory.role}
                              onChange={(e) => updateSignatory(index, 'role', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={loading}
                            >
                              <option value="client">Cliente</option>
                              <option value="contractor">Contratista</option>
                              <option value="witness">Testigo</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notas internas sobre el contrato..."
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}

                {/* Auto-renewal option */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="auto_renewal"
                      checked={formData.auto_renewal || false}
                      onChange={(e) => handleInputChange('auto_renewal', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <label htmlFor="auto_renewal" className="text-sm font-medium text-purple-900 cursor-pointer">
                        Activar renovación automática
                      </label>
                      <p className="text-xs text-purple-700 mt-1">
                        El contrato se renovará automáticamente cuando expire, manteniendo los mismos términos
                      </p>
                    </div>
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="small" />
                        <span>{isEditMode ? 'Actualizando...' : 'Creando...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>{isEditMode ? 'Actualizar Contrato' : 'Crear Contrato'}</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="border border-gray-300 rounded-lg p-6 bg-white">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa del Contrato</h4>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                    {previewContent || 'Haz clic en "Vista Previa" para generar el contenido procesado'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};