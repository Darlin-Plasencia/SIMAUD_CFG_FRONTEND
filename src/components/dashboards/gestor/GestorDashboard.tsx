import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  UserCheck,
  Search,
  Send,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserProfile } from '../../common/UserProfile';
import { ContractManagement } from '../../contracts/ContractManagement';

type GestorView = 'dashboard' | 'contracts' | 'profile';

export const GestorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<GestorView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    {
      title: 'Mis Contratos',
      value: '18',
      change: '+3',
      icon: FileText,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'En Borrador',
      value: '5',
      change: '+2',
      icon: PlusCircle,
      color: 'from-gray-500 to-gray-600'
    },
    {
      title: 'En Aprobación',
      value: '3',
      change: '+1',
      icon: Clock,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Aprobados',
      value: '10',
      change: '+2',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600'
    }
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contracts', label: 'Mis Contratos', icon: FileText },
    { id: 'profile', label: 'Mi Perfil', icon: UserCheck }
  ];

  const renderMainContent = () => {
    switch (currentView) {
      case 'contracts':
        return <ContractManagement />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <DashboardHome stats={stats} />;
      default:
        return <DashboardHome stats={stats} />;
    }
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
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
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
const DashboardHome: React.FC<{ stats: any[] }> = ({ stats }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">¡Hola, {user?.name}!</h2>
            <p className="text-purple-100">Gestiona tus contratos de manera eficiente</p>
          </div>
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
                  stat.change.startsWith('+') 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            {[
              { icon: PlusCircle, label: 'Crear Nuevo Contrato', color: 'text-purple-600', bg: 'hover:bg-purple-50' },
              { icon: Send, label: 'Enviar a Aprobación', color: 'text-blue-600', bg: 'hover:bg-blue-50' },
              { icon: Eye, label: 'Ver Contratos Pendientes', color: 'text-orange-600', bg: 'hover:bg-orange-50' },
              { icon: BarChart3, label: 'Ver Reportes', color: 'text-green-600', bg: 'hover:bg-green-50' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 ${action.color} ${action.bg}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-gray-900">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Contract Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Contratos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <PlusCircle className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Borradores</p>
                  <p className="text-xs text-gray-500">Listos para revisar</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">5</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">En Aprobación</p>
                  <p className="text-xs text-gray-500">Esperando supervisor</p>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-600">3</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Aprobados</p>
                  <p className="text-xs text-gray-500">Listos para firmar</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">10</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Rechazados</p>
                  <p className="text-xs text-gray-500">Requieren cambios</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Contracts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contratos Recientes</h3>
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            Ver todos
          </button>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Contrato de Servicios - TechCorp', status: 'En Aprobación', date: '2 horas', statusColor: 'text-orange-600 bg-orange-100' },
            { title: 'Consultoría Digital - StartupXYZ', status: 'Aprobado', date: '1 día', statusColor: 'text-green-600 bg-green-100' },
            { title: 'Desarrollo Web - InnovaLab', status: 'Borrador', date: '2 días', statusColor: 'text-gray-600 bg-gray-100' }
          ].map((contract, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{contract.title}</h4>
                <p className="text-xs text-gray-500">Hace {contract.date}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contract.statusColor}`}>
                {contract.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};