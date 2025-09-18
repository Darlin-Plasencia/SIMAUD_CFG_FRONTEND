import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Users,
  Calendar,
  DollarSign,
  Filter,
  Search,
  MoreHorizontal,
  Send,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ContractViewModal } from './ContractViewModal';
import { ContractModal } from './ContractModal';
import type { Contract } from '../../types/contracts';

export const ContractManagement: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [signatureProgress, setSignatureProgress] = useState<Record<string, { total: number; completed: number }>>({});

  useEffect(() => {
    loadContracts();
  }, [user]);

  const loadContracts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading contracts for user:', user.id, 'role:', user.role);

      let query = supabase
        .from('contracts')
        .select(`
          id,
          template_id,
          title,
          content,
          variables_data,
          client_name,
          client_email,
          client_phone,
          status,
          created_by,
          created_at,
          updated_at,
          approval_status,
          current_version,
          approved_by,
          approved_at,
          rejection_reason,
          contract_value,
          start_date,
          end_date,
          generated_content,
          notes,
          template:contract_templates(title),
          creator:user_profiles!created_by(name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (user.role === 'admin' || user.role === 'supervisor') {
        // Admin/supervisor can see all contracts
      } else {
        // Users can only see their own contracts
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading contracts:', error);
        throw error;
      }

      console.log('Loaded contracts:', data);
      setContracts(data || []);

      // Load signature progress for each contract
      if (data && data.length > 0) {
        await loadSignatureProgress(data.map(c => c.id));
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignatureProgress = async (contractIds: string[]) => {
    try {
      const { data: signatories, error } = await supabase
        .from('contract_signatories')
        .select('contract_id, signed_at')
        .in('contract_id', contractIds);

      if (error) throw error;

      const progressMap: Record<string, { total: number; completed: number }> = {};
      
      contractIds.forEach(contractId => {
        const contractSignatories = signatories?.filter(s => s.contract_id === contractId) || [];
        progressMap[contractId] = {
          total: contractSignatories.length,
          completed: contractSignatories.filter(s => s.signed_at).length
        };
      });

      setSignatureProgress(progressMap);
    } catch (error) {
      console.error('Error loading signature progress:', error);
    }
  };

  const handleCreateContract = () => {
    setEditingContract(null);
    setShowContractModal(true);
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setShowContractModal(true);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowViewModal(true);
  };

  const handleDeleteContract = async (contract: Contract) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el contrato "${contract.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;

      setContracts(prev => prev.filter(c => c.id !== contract.id));
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Error al eliminar el contrato');
    }
  };

  const handleSendForApproval = async (contract: Contract) => {
    console.log('🔄 Sending contract for approval:', contract.id);
    
    try {
      // First check current status
      const { data: currentContract, error: fetchError } = await supabase
        .from('contracts')
        .select('approval_status, current_version')
        .eq('id', contract.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      console.log('📋 Current contract status:', currentContract);
      
      // Update contract status to pending_approval
      const { data: updatedContract, error } = await supabase
        .from('contracts')
        .update({ 
          approval_status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Contract status updated:', updatedContract);
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify approval record was created
      const { data: approvalRecord, error: approvalError } = await supabase
        .from('contract_approvals')
        .select('*')
        .eq('contract_id', contract.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (approvalError) {
        console.error('❌ Error checking approval record:', approvalError);
      } else {
        console.log('📝 Approval record created:', approvalRecord);
      }
      
      console.log('✅ Contract sent for approval successfully');

      await loadContracts();
    } catch (error) {
      console.error('Error sending contract for approval:', error);
      alert('Error al enviar el contrato para aprobación');
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

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contract.approval_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getSignatureProgressDisplay = (contractId: string) => {
    const progress = signatureProgress[contractId];
    if (!progress || progress.total === 0) {
      return null;
    }

    const isComplete = progress.completed === progress.total;
    const progressPercentage = (progress.completed / progress.total) * 100;

    return (
      <div className="flex items-center space-x-2 text-xs">
        <Users className="w-4 h-4 text-gray-400" />
        <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
          {progress.completed}/{progress.total}
        </span>
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Contratos</h2>
          <p className="text-gray-600">Administra y gestiona todos tus contratos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateContract}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo Contrato
        </motion.button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar contratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="pending_approval">En Aprobación</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="signed">Firmado</option>
              <option value="completed">Completado</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredContracts.length} contrato{filteredContracts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron contratos' : 'No hay contratos'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Crea tu primer contrato para comenzar'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={handleCreateContract}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Crear Contrato
              </button>
            )}
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const StatusIcon = getStatusIcon(contract.approval_status);
            const progress = signatureProgress[contract.id];
            
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <StatusIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={contract.title}>
                        {contract.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {contract.template?.title || 'Sin plantilla'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewContract(contract)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(contract.approval_status === 'draft' || contract.approval_status === 'rejected') && (
                      <button
                        onClick={() => handleEditContract(contract)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <div className="relative group">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                        {contract.approval_status === 'draft' && (
                          <button
                            onClick={() => handleSendForApproval(contract)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Enviar a Aprobación</span>
                          </button>
                        )}
                        {(contract.approval_status === 'draft' || contract.approval_status === 'rejected') && (
                          <button
                            onClick={() => handleDeleteContract(contract)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.approval_status)}`}>
                    {contract.approval_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Contract Info */}
                <div className="space-y-3 mb-4">
                  {contract.client_name && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="truncate">{contract.client_name}</span>
                    </div>
                  )}
                  {contract.contract_value && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(contract.contract_value)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(contract.created_at)}</span>
                  </div>
                </div>

                {/* Signature Progress */}
                {getSignatureProgressDisplay(contract.id)}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleViewContract(contract)}
                    className="flex-1 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-center"
                  >
                    Ver Detalles
                  </motion.button>
                  {(contract.approval_status === 'draft' || contract.approval_status === 'rejected') && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEditContract(contract)}
                      className="flex-1 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-center"
                    >
                      Editar
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showContractModal && (
        <ContractModal
          isOpen={showContractModal}
          onClose={() => {
            setShowContractModal(false);
            setEditingContract(null);
          }}
          contract={editingContract}
          isEditMode={!!editingContract}
          onSuccess={() => {
            setShowContractModal(false);
            setEditingContract(null);
            loadContracts();
          }}
        />
      )}

      {selectedContract && (
        <ContractViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
        />
      )}
    </div>
  );
};