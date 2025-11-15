import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import AppRouter from './router/AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppRouter />
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
