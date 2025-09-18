import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  UserCheck,
  Search,
  Send,
  Eye,
  BarChart3,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Target
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserProfile } from '../../common/UserProfile';
import { ContractManagement } from '../../contracts/ContractManagement';
import { RenewalCenter } from '../../renewals/RenewalCenter';
import { NotificationCenter } from '../../notifications/NotificationCenter';
import { ExpiryAlerts } from '../../notifications/ExpiryAlerts';
import { LoadingSpinner } from '../../common/LoadingSpinner';

type GestorView = 'dashboard' | 'contracts' | 'renewals' | 'profile';

export const GestorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<GestorView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contracts', label: 'Mis Contratos', icon: FileText },
    { id: 'renewals', label: 'Renovaciones', icon: RefreshCw },
    { id: 'profile', label: 'Mi Perfil', icon: UserCheck }
  ];

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
  }, [currentView, user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-stats?role=gestor&userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'contracts':
        return <ContractManagement onCreateContract={handleCreateContract} />;
      case 'renewals':
        return <RenewalCenter />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <GestorDashboardHome data={dashboardData} loading={loading} error={error} onRefresh={loadDashboardData} onCreateContract={handleCreateContract} />;
      default:
        return <GestorDashboardHome data={dashboardData} loading={loading} error={error} onRefresh={loadDashboardData} onCreateContract={handleCreateContract} />;
    }
  };

  const handleCreateContract = () => {
    setCurrentView('contracts');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">SIMAUD</h1>
              <p className="text-xs text-gray-500">Gestor de Contratos</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as GestorView);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-purple-700' : 'text-gray-400'
                  }`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button 
            onClick={() => setCurrentView('profile')}
            className="w-full flex items-center space-x-3 mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">Gestor de Contratos</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => item.id === currentView)?.label}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentView === 'dashboard' && 'Panel de control del gestor de contratos'}
                  {currentView === 'contracts' && 'Gestiona tus contratos y documentos'}
                 {currentView === 'renewals' && 'Gestiona solicitudes de renovación'}
                  {currentView === 'profile' && 'Gestiona tu información personal'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar contratos..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              <NotificationCenter onNavigate={(url) => {
                if (url.includes('/contracts/')) {
                  setCurrentView('contracts');
                } else if (url.includes('/renewals/')) {
                  setCurrentView('renewals');
                }
              }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {/* Expiry Alerts for Dashboard */}
            {currentView === 'dashboard' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Mis Contratos Próximos a Vencer</h3>
                <ExpiryAlerts 
                  onViewContract={(contractId) => setCurrentView('contracts')}
                  maxItems={3}
                />
              </div>
            )}
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Dashboard Home Component
const GestorDashboardHome: React.FC<{ 
  data: any; 
  loading: boolean; 
  error: string; 
  onRefresh: () => void;
  onCreateContract: () => void;
}> = ({ data, loading, error, onRefresh, onCreateContract }) => {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Mis Contratos',
      value: data.stats.total_contracts.toString(),
      change: `+${data.stats.new_contracts_month}`,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      description: 'nuevos este mes'
    },
    {
      title: 'En Borrador',
      value: data.stats.draft_contracts.toString(),
      change: `${data.stats.contracts_this_week}`,
      icon: PlusCircle,
      color: 'from-gray-500 to-gray-600',
      description: 'creados esta semana'
    },
    {
      title: 'En Aprobación',
      value: data.stats.pending_approval.toString(),
      change: `${data.stats.approval_rate.toFixed(1)}%`,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      description: 'tasa aprobación'
    },
    {
      title: 'Aprobados',
      value: data.stats.approved_contracts.toString(),
      change: `$${(data.stats.total_value / 1000).toFixed(0)}K`,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      description: 'valor total'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">¡Hola, {user?.name}!</h2>
              <p className="text-purple-100">Gestiona tus contratos de manera eficiente</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.change.includes('%') || stat.change.includes('K')
                    ? 'text-blue-600 bg-blue-100'
                    : stat.change.startsWith('+') || parseInt(stat.change) > 0
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-600 bg-gray-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateContract}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-purple-600"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium text-gray-900">Crear Nuevo Contrato</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('contracts')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-blue-600"
            >
              <Eye className="w-5 h-5" />
              <span className="font-medium text-gray-900">Ver Mis Contratos</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-green-600"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium text-gray-900">Ver Reportes</span>
            </motion.button>
          </div>
        </div>

        {/* Contract Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Mis Contratos</h3>
          <div className="space-y-4">
            {Object.entries(data.charts.status_distribution).map(([status, count]: [string, any]) => {
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'draft': return PlusCircle;
                  case 'pending_approval': return Clock;
                  case 'approved': return CheckCircle;
                  case 'rejected': return XCircle;
                  case 'signed': return Users;
                  case 'completed': return CheckCircle;
                  default: return FileText;
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
              
              const StatusIcon = getStatusIcon(status);
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <StatusIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {((count / data.stats.total_contracts) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts by Month */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contratos por Mes</h3>
          <div className="space-y-3">
            {Object.entries(data.charts.contracts_by_month).map(([month, count]: [string, any]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(data.charts.contracts_by_month))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contratos Recientes</h3>
          <div className="space-y-3">
            {data.recent_contracts?.slice(0, 5).map((contract: any, index: number) => (
              <div key={contract.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{contract.title}</p>
                  <p className="text-xs text-gray-500">
                    {contract.client_name} • {new Date(contract.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  contract.approval_status === 'approved' ? 'text-green-600 bg-green-100' :
                  contract.approval_status === 'pending_approval' ? 'text-orange-600 bg-orange-100' :
                  contract.approval_status === 'rejected' ? 'text-red-600 bg-red-100' :
                  'text-gray-600 bg-gray-100'
                }`}>
                  {contract.approval_status.replace('_', ' ')}
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">No tienes contratos recientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Mis Métricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{data.stats.approval_rate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Tasa de Aprobación</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ${(data.stats.avg_contract_value / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-gray-600">Valor Promedio</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{data.stats.total_value.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Valor Total Generado</p>
          </div>
        </div>
      </div>
    </div>
  );
};