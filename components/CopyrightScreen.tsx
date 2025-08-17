
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface CopyrightScreenProps {
  onExit: () => void;
}

const CopyrightScreen: React.FC<CopyrightScreenProps> = ({ onExit }) => {
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Direitos Autorais</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto text-gray-300 leading-relaxed scrollbar-hide">
        <h2 className="text-2xl font-bold text-white mb-4">Aviso de Direitos Autorais do LiveGo</h2>
        
        <p className="mb-4">
          Copyright &copy; {new Date().getFullYear()} LiveGo. Todos os direitos reservados.
        </p>

        <h3 className="text-xl font-semibold text-white mt-6 mb-2">1. Propriedade Intelectual</h3>
        <p className="mb-4">
          Todo o conteúdo presente neste aplicativo, incluindo, mas não se limitando a, texto, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais, compilações de dados e software, é propriedade da LiveGo ou de seus fornecedores de conteúdo e protegido pelas leis internacionais de direitos autorais. A compilação de todo o conteúdo neste aplicativo é propriedade exclusiva da LiveGo.
        </p>

        <h3 className="text-xl font-semibold text-white mt-6 mb-2">2. Marcas Registradas</h3>
        <p className="mb-4">
          O nome "LiveGo", o logotipo e outros gráficos, logotipos, cabeçalhos de página, ícones de botão, scripts e nomes de serviço são marcas comerciais, marcas registradas ou identidade visual da LiveGo. As marcas comerciais e a identidade visual da LiveGo não podem ser usadas em conexão com qualquer produto ou serviço que não seja da LiveGo, de nenhuma maneira que possa causar confusão entre os clientes, ou de qualquer maneira que deprecie ou desacredite a LiveGo.
        </p>

        <h3 className="text-xl font-semibold text-white mt-6 mb-2">3. Conteúdo Gerado pelo Usuário</h3>
        <p className="mb-4">
          Os usuários são responsáveis pelo conteúdo que publicam, transmitem ou disponibilizam através do serviço. Ao usar o LiveGo, você concede à LiveGo uma licença mundial, não exclusiva, isenta de royalties, sublicenciável e transferível para usar, reproduzir, distribuir, preparar trabalhos derivados, exibir e executar o conteúdo em conexão com o serviço.
        </p>
      </main>
    </div>
  );
};

export default CopyrightScreen;