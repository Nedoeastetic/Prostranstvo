import { AppProvider, useAppState } from './store';
import LoginScreen from './components/LoginScreen';
import HomePage from './components/HomePage';
import TopBar from './components/TopBar';
import Editor2D from './components/Editor2D';
import Sidebar from './components/Sidebar';
import InventoryPanel from './components/InventoryPanel';
import ValidationPanel from './components/ValidationPanel';
import AIAssistant from './components/AIAssistant';
import View3D from './components/View3D';

function AppContent() {
  const { state, dispatch } = useAppState();

  // Экран входа
  if (!state.isAuthenticated) {
    return <LoginScreen onLogin={() => dispatch({ type: 'LOGIN' })} />;
  }

  // Главная страница
  if (state.currentPage === 'home') {
    return (
      <HomePage
        onCreateProject={() => dispatch({ type: 'SET_PAGE', payload: 'editor' })}
        onOpenProject={() => dispatch({ type: 'SET_PAGE', payload: 'editor' })}
        onLogout={() => dispatch({ type: 'LOGOUT' })}
        onImportProject={(plan) => {
          dispatch({ type: 'SET_PLAN', payload: plan });
          dispatch({ type: 'SET_PAGE', payload: 'editor' });
        }}
      />
    );
  }

  // Редактор
  return (
    <div className="h-screen w-screen flex flex-col bg-[#141414] overflow-hidden">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {state.activeTab === 'editor' && (
          <>
            <div className="flex-1 relative">
              <Editor2D />
            </div>
            <Sidebar />
          </>
        )}
        {state.activeTab === 'inventory' && <InventoryPanel />}
        {state.activeTab === 'validation' && <ValidationPanel />}
        {state.activeTab === 'ai' && <AIAssistant />}
        {state.activeTab === '3d' && <View3D />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
