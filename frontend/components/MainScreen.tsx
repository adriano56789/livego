import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function MainScreen() {
  const navigate = useNavigate();

  // Verifica se o usuário está autenticado
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Bem-vindo à LiveGo</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Você está logado!</h2>
          <p className="text-gray-700">
            Esta é a tela principal da aplicação. Aqui você pode adicionar todo o conteúdo
            da sua aplicação, como streams ao vivo, lista de vídeos, etc.
          </p>
        </div>
      </div>
    </div>
  );
}