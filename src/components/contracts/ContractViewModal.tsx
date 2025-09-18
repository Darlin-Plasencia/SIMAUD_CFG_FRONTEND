import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Users,
  Eye,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { 
  Contract, 
  ContractSignatory, 
  ContractVersion, 
  ContractAuditLog 
} from '../../types/contracts';

interface ContractViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
}

export const ContractViewModal: React.FC<ContractViewModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'signatories' | 'versions' | 'audit'>('details');
  const [loading, setLoading] = useState(false);
  const [signatories, setSignatories] = useState<ContractSignatory[]>([]);
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<ContractAuditLog[]>([]);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadContractData();
    }
  }, [isOpen, contract.id]);

  const loadContractData = async () => {
    setLoading(true);
    try {
      // Cargar firmantes
      console.log('Loading signatories for contract:', contract.id);
      
      const { data: signatoriesData, error: signatoriesError } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contract.id)
        .order('signing_order');

      if (signatoriesError) {
        console.error('Error loading signatories:', signatoriesError);
        throw signatoriesError;
      }
      
      console.log('Loaded signatories data:', signatoriesData);
      setSignatories(signatoriesData || []);

      // Cargar versiones
      const { data: versionsData, error: versionsError } = await supabase
        .from('contract_versions')
        .select(`
          *,
          creator:user_profiles!created_by(name, email)
        `)
        .eq('contract_id', contract.id)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;
      setVersions(versionsData || []);

      // Cargar logs de auditoria
      const { data: auditData, error: auditError } = await supabase
        .from('contract_audit_logs')
        .select('*')
        .eq('contract_id', contract.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;
      setAuditLogs(auditData || []);

      // Generar contenido procesado
      if (contract.generated_content) {
        setPreviewContent(contract.generated_content);
      }
    } catch (error) {
      console.error('Error loading contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'pending_approval': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'signed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'signed': return Users;
      case 'completed': return CheckCircle;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: FileText },
    { id: 'signatories', label: 'Firmantes', icon: Users },
    { id: 'versions', label: 'Versiones', icon: History },
    { id: 'audit', label: 'Auditoria', icon: MessageCircle }
  ];

  if (!isOpen) return null;

  const StatusIcon = getStatusIcon(contract.approval_status);

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
              <StatusIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.approval_status)}`}>
                  {contract.approval_status.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  Versión {contract.current_version}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Contract Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Cliente</h4>
                      </div>
                      <p className="text-sm text-gray-600">{contract.client_name || 'N/A'}</p>
                      {contract.client_email && (
                        <p className="text-xs text-gray-500 mt-1">{contract.client_email}</p>
                      )}
                      {contract.client_phone && (
                        <p className="text-xs text-gray-500">{contract.client_phone}</p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">Valor</h4>
                      </div>
                      <p className="text-sm text-gray-600">{formatCurrency(contract.contract_value)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">Fechas</h4>
                      </div>
                      <p className="text-xs text-gray-500">Inicio: {formatDate(contract.start_date)}</p>
                      <p className="text-xs text-gray-500">Fin: {formatDate(contract.end_date)}</p>
                    </div>
                  </div>

                  {/* Signature Progress - Solo mostrar si hay firmantes */}
                  {signatories.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900">Progreso de Firmas</h4>
                        </div>
                        <SignatureProgressBadge signatories={signatories} />
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${signatories.length > 0 ? (signatories.filter(s => s.signed_at).length / signatories.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contract Content */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Contenido del Contrato</h4>
                    </div>
                    <ContractContentViewer 
                      contract={contract} 
                      previewContent={previewContent}
                    />
                  </div>

                  {/* Notes */}
                  {contract.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {contract.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'signatories' && (
                <div className="space-y-4">
                  {/* Signature Progress Header */}
                  {signatories.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Estado de Firmas</h4>
                          <p className="text-sm text-gray-600">
                            {signatories.filter(s => s.signed_at).length} de {signatories.length} firmantes han firmado
                          </p>
                        </div>
                        <SignatureProgressBadge signatories={signatories} />
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 mt-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${signatories.length > 0 ? (signatories.filter(s => s.signed_at).length / signatories.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {signatories.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay firmantes registrados</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Los firmantes aparecerán aquí una vez que se agreguen al contrato
                      </p>
                    </div>
                  ) : (
                    signatories.map((signatory, index) => (
                      <motion.div 
                        key={signatory.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              signatory.signed_at ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              <span className="text-xs font-semibold text-blue-600">
                                {signatory.signing_order}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{signatory.name}</h4>
                              <p className="text-sm text-gray-600 capitalize flex items-center space-x-1">
                                <span>{signatory.role}</span>
                                {signatory.status && (
                                  <span className="text-xs">• {signatory.status}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {signatory.signed_at ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Firmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{signatory.email}</span>
                          </div>
                          {signatory.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{signatory.phone}</span>
                            </div>
                          )}
                        </div>
                        {signatory.signed_at && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              Firmado el {formatDate(signatory.signed_at)}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-4">
                  {versions.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay versiones registradas</p>
                    </div>
                  ) : (
                    versions.map((version: any) => (
                      <div key={version.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                              <span className="text-xs font-semibold text-purple-600">
                                v{version.version_number}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Versión {version.version_number}
                              </h4>
                              <p className="text-sm text-gray-600">
                                por {version.creator?.name || 'Usuario desconocido'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(version.created_at)}
                          </span>
                        </div>
                        {version.change_summary && (
                          <p className="text-sm text-gray-600 mt-2">
                            {version.change_summary}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-4">
                  {/* Approval History Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Historial de Aprobaciones</span>
                    </h4>
                    <ApprovalHistory contractId={contract.id} />
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay registros de auditoria</p>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                              <MessageCircle className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 capitalize">
                                {log.action}
                              </h4>
                              <p className="text-sm text-gray-600">
                                por {log.user_name || 'Sistema'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Componente para mostrar progreso de firmas
const SignatureProgressBadge: React.FC<{ signatories: any[] }> = ({ signatories }) => {
  const totalSignatories = signatories.length;
  const completedSignatures = signatories.filter(s => s.signed_at).length;
  
  const getProgressColor = () => {
    if (completedSignatures === 0) return 'text-gray-600 bg-gray-100';
    if (completedSignatures === totalSignatories) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getProgressColor()}`}>
      <Users className="w-4 h-4 mr-2" />
      {completedSignatures}/{totalSignatories} Firmas
    </span>
  );
};

// Componente para mostrar contenido del contrato
const ContractContentViewer: React.FC<{ contract: any; previewContent: string }> = ({ 
  contract, 
  previewContent 
}) => {
  const [processedContent, setProcessedContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processContractContent();
  }, [contract, previewContent]);

  const processContractContent = async () => {
    try {
      setLoading(true);
      
      // Si ya hay contenido procesado, usarlo
      if (previewContent) {
        setProcessedContent(previewContent);
        setLoading(false);
        return;
      }
      
      // Si hay generated_content, usarlo
      if (contract.generated_content) {
        setProcessedContent(contract.generated_content);
        setLoading(false);
        return;
      }
      
      // Procesar el contenido con variables
      let content = contract.content || '';
      
      if (contract.variables_data && contract.template_id) {
        try {
          const { data: template } = await supabase
            .from('contract_templates')
            .select('variables')
            .eq('id', contract.template_id)
            .single();
            
          if (template && template.variables) {
            const { data: variables } = await supabase
              .from('template_variables')
              .select('*')
              .in('name', template.variables);
              
            if (variables) {
              variables.forEach(variable => {
                const value = contract.variables_data[variable.name] || `[${variable.label}]`;
                content = content.replace(
                  new RegExp(`{{${variable.name}}}`, 'g'), 
                  value
                );
              });
            }
          }
        } catch (error) {
          console.warn('Error processing variables:', error);
        }
      }
      
      setProcessedContent(content);
    } catch (error) {
      console.error('Error processing contract content:', error);
      setProcessedContent(contract.content || 'Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <h5 className="font-medium text-gray-900">Documento Completo</h5>
      </div>
      <div className="p-6">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
            {processedContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
// Componente para mostrar historial de aprobaciones
const ApprovalHistory: React.FC<{ contractId: string }> = ({ contractId }) => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovalHistory();
  }, [contractId]);

  const loadApprovalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_approvals')
        .select(`
          *,
          requester:user_profiles!requested_by(name, email),
          reviewer:user_profiles!reviewed_by(name, email)
        `)
        .eq('contract_id', contractId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error loading approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return History;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No hay historial de aprobaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval, index) => {
        const StatusIcon = getStatusIcon(approval.status);
        return (
          <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <span className="text-xs font-semibold text-blue-600">
                    v{approval.version_number}
                  </span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    Solicitud de Aprobación #{approvals.length - index}
                  </h5>
                  <p className="text-sm text-gray-600">
                    Solicitado por {approval.requester?.name || 'Usuario desconocido'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {approval.status === 'pending' ? 'Pendiente' :
                 approval.status === 'approved' ? 'Aprobado' : 'Rechazado'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Solicitado:</span> {formatDate(approval.requested_at)}
              </div>
              {approval.reviewed_at && (
                <div>
                  <span className="font-medium">
                    {approval.status === 'approved' ? 'Aprobado' : 'Rechazado'}:
                  </span> {formatDate(approval.reviewed_at)}
                </div>
              )}
            </div>

            {approval.reviewer && (
              <div className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Revisado por:</span> {approval.reviewer.name}
              </div>
            )}

            {approval.comments && (
              <div className={`p-3 rounded-lg text-sm ${
                approval.status === 'rejected' 
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <MessageCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    approval.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                  <div>
                    <h6 className={`font-semibold text-xs uppercase tracking-wide mb-1 ${
                      approval.status === 'rejected' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {approval.status === 'rejected' ? 'Motivo del Rechazo:' : 'Comentarios:'}
                    </h6>
                    <p className={approval.status === 'rejected' ? 'text-red-700' : 'text-gray-700'}>
                      {approval.comments}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};