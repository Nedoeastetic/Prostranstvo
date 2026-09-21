import { useState } from 'react';
import { Upload } from 'lucide-react';
import ImportModal from './ImportModal';
import { PlanData } from '../types';

interface HomePageProps {
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onLogout: () => void;
  onImportProject?: (plan: PlanData) => void;
}

interface RecentProject {
  id: string;
  name: string;
  updatedAt: string;
  preview: string; // SVG или описание мини-макета
}

export default function HomePage({ onCreateProject, onOpenProject, onLogout, onImportProject }: HomePageProps) {
  const [activeNav, setActiveNav] = useState('Главная');
  const [showImportModal, setShowImportModal] = useState(false);

  // Демо-данные недавних проектов
  const recentProjects: RecentProject[] = [
    {
      id: '1',
      name: 'Отделение №14',
      updatedAt: '15.01.2026',
      preview: 'office',
    },
    {
      id: '2',
      name: 'Отделение №27',
      updatedAt: '12.01.2026',
      preview: 'warehouse',
    },
    {
      id: '3',
      name: 'Отделение №8',
      updatedAt: '08.01.2026',
      preview: 'small',
    },
  ];

  const renderMiniPreview = (type: string) => {
    switch (type) {
      case 'office':
        return (
          <svg width="100%" height="100%" viewBox="0 0 273 270" className="p-4">
            {/* Внешние стены */}
            <rect x="20" y="20" width="233" height="230" fill="none" stroke="#64748B" strokeWidth="3" />
            {/* Зоны */}
            <rect x="20" y="20" width="80" height="100" fill="#3B82F6" fillOpacity="0.3" stroke="#3B82F6" strokeWidth="1.5" />
            <rect x="100" y="20" width="153" height="100" fill="#8B5CF6" fillOpacity="0.3" stroke="#8B5CF6" strokeWidth="1.5" />
            <rect x="20" y="120" width="120" height="130" fill="#10B981" fillOpacity="0.3" stroke="#10B981" strokeWidth="1.5" />
            <rect x="140" y="120" width="113" height="130" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1.5" />
            {/* Объекты */}
            <rect x="110" y="40" width="30" height="20" fill="#2563EB" />
            <rect x="150" y="40" width="30" height="20" fill="#2563EB" />
            <rect x="190" y="40" width="30" height="20" fill="#2563EB" />
            <rect x="40" y="150" width="40" height="25" fill="#2563EB" />
            <rect x="160" y="160" width="35" height="15" fill="#D97706" />
            <rect x="160" y="190" width="35" height="15" fill="#D97706" />
          </svg>
        );
      case 'warehouse':
        return (
          <svg width="100%" height="100%" viewBox="0 0 273 270" className="p-4">
            {/* Внешние стены */}
            <rect x="20" y="20" width="233" height="230" fill="none" stroke="#64748B" strokeWidth="3" />
            {/* Зоны */}
            <rect x="20" y="20" width="233" height="80" fill="#8B5CF6" fillOpacity="0.3" stroke="#8B5CF6" strokeWidth="1.5" />
            <rect x="20" y="100" width="233" height="150" fill="#6B7280" fillOpacity="0.3" stroke="#6B7280" strokeWidth="1.5" />
            {/* Стеллажи */}
            <rect x="40" y="120" width="60" height="20" fill="#D97706" />
            <rect x="40" y="150" width="60" height="20" fill="#D97706" />
            <rect x="40" y="180" width="60" height="20" fill="#D97706" />
            <rect x="120" y="120" width="60" height="20" fill="#D97706" />
            <rect x="120" y="150" width="60" height="20" fill="#D97706" />
            <rect x="120" y="180" width="60" height="20" fill="#D97706" />
            <rect x="200" y="120" width="40" height="80" fill="#D97706" />
          </svg>
        );
      case 'small':
        return (
          <svg width="100%" height="100%" viewBox="0 0 273 270" className="p-4">
            {/* Внешние стены */}
            <rect x="40" y="40" width="193" height="190" fill="none" stroke="#64748B" strokeWidth="3" />
            {/* Зоны */}
            <rect x="40" y="40" width="193" height="90" fill="#3B82F6" fillOpacity="0.3" stroke="#3B82F6" strokeWidth="1.5" />
            <rect x="40" y="130" width="193" height="100" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1.5" />
            {/* Объекты */}
            <rect x="60" y="60" width="35" height="20" fill="#DC2626" />
            <rect x="110" y="60" width="35" height="20" fill="#DC2626" />
            <rect x="160" y="60" width="35" height="20" fill="#DC2626" />
            <rect x="70" y="160" width="25" height="25" fill="#DB2777" />
            <rect x="110" y="160" width="25" height="25" fill="#DB2777" />
            <rect x="150" y="160" width="25" height="25" fill="#DB2777" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#141414] overflow-y-auto relative">
      {/* Верхняя плашка */}
      <div
        className="sticky top-0 z-40 w-full h-[60px] flex items-center px-6 border-b border-slate-800"
        style={{
          background: '#737676',
        }}
      >
        {/* Логотип */}
        <div className="text-white text-xl font-black uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
          ПОЧТА.ПРОСТРАНСТВО
        </div>

        {/* Навигация */}
        <div className="ml-auto flex items-center gap-8">
          <button
            onClick={() => setActiveNav('Главная')}
            className={`text-base transition-colors ${
              activeNav === 'Главная' ? 'text-white font-semibold' : 'text-slate-200 font-normal hover:text-white'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Главная
          </button>
          <button
            onClick={() => setActiveNav('Личный кабинет')}
            className={`text-base transition-colors ${
              activeNav === 'Личный кабинет' ? 'text-white font-semibold' : 'text-slate-200 font-normal hover:text-white'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Личный кабинет
          </button>
          <button
            onClick={() => setActiveNav('Тех.поддержка')}
            className={`text-base transition-colors ${
              activeNav === 'Тех.поддержка' ? 'text-white font-semibold' : 'text-slate-200 font-normal hover:text-white'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Тех.поддержка
          </button>
          <button
            onClick={onLogout}
            className="text-base text-slate-200 font-normal hover:text-white transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Новый проект */}
        <div className="mb-8">
          <h2 className="text-white text-3xl font-semibold mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Новый проект
          </h2>

          <div className="flex gap-7">
            {/* Кнопка создания */}
            <button
              onClick={onCreateProject}
              className="w-[126px] h-[129px] bg-[#1e1e1e] border-2 border-slate-700 rounded-2xl flex items-center justify-center hover:border-blue-500 hover:bg-[#252525] transition-all shadow-lg"
            >
              <span
                className="text-white text-8xl font-normal leading-none"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                +
              </span>
            </button>

            {/* Кнопка импорта */}
            <button
              onClick={() => setShowImportModal(true)}
              className="w-[126px] h-[129px] bg-slate-800 border-2 border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 hover:border-blue-500 transition-all shadow-lg"
            >
              <Upload size={32} className="text-white" />
              <span
                className="text-white text-xs font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Импорт
              </span>
            </button>
          </div>
        </div>

        {/* Модалка импорта */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={(plan) => {
            if (onImportProject) {
              onImportProject(plan);
            } else {
              onCreateProject();
            }
          }}
        />

        {/* Недавние */}
        <div>
          <h2 className="text-white text-3xl font-semibold mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Недавние
          </h2>

          {/* Карточки проектов */}
          <div className="flex flex-wrap gap-7">
            {recentProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="w-[273px] h-[270px] bg-[#1e1e1e] border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500 hover:bg-[#252525] transition-all shadow-lg text-left"
              >
                {/* Мини-макет */}
                <div className="w-full h-[200px] bg-[#252525]">
                  {renderMiniPreview(project.preview)}
                </div>
                {/* Информация */}
                <div className="p-4">
                  <div className="text-white text-sm font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {project.name}
                  </div>
                  <div className="text-slate-400 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {project.updatedAt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
