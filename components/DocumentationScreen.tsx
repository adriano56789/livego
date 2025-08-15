import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface DocumentationScreenProps {
  onExit: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-green-400 mb-4 pb-2 border-b-2 border-green-400/30">{title}</h2>
    <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
  </section>
);

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto">
    <code className="text-sm font-mono text-cyan-300">{children}</code>
  </pre>
);

const DocumentationScreen: React.FC<DocumentationScreenProps> = ({ onExit }) => {
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Documentação de Venda</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto">
        
        <Section title="1. Proposta de Valor">
          <p>O LiveGo é um aplicativo de streaming ao vivo "plug-and-play" pronto para o mercado. Ele foi construído com uma arquitetura escalável e uma interface de usuário moderna para atrair e reter usuários. A plataforma está pronta para gerar receita através de um sistema de presentes virtuais e taxas de saque, com potencial de expansão para assinaturas e anúncios.</p>
          <p>Este pacote inclui tudo o que é necessário para um comprador lançar o produto rapidamente, minimizando o tempo de desenvolvimento e os custos.</p>
        </Section>

        <Section title="2. Documentação da API (Simulada)">
          <p>A API foi projetada para ser RESTful e intuitiva. Todos os dados são gerenciados por um backend simulado que imita as operações de um banco de dados real, tornando a transição para um ambiente de produção simples. O aplicativo frontend já está totalmente conectado a essa API simulada.</p>
          <h3 className="font-semibold text-lg text-white mt-4">Endpoints Principais:</h3>
          <p><strong className="text-yellow-400">GET /api/lives/popular</strong>: Retorna uma lista das transmissões ao vivo mais populares.</p>
          <CodeBlock>
{`[
  {
    "id": 101,
    "userId": 401,
    "titulo": "PK Challenge",
    "nomeStreamer": "Lest Go 500 K...",
    "espectadores": 680460,
    ...
  }
]`}
          </CodeBlock>
           <p className="mt-4"><strong className="text-yellow-400">POST /api/auth/google</strong>: Autentica um usuário e retorna seu perfil.</p>
          <CodeBlock>
{`{
  "id": 10755083,
  "name": "GamerX",
  "email": "gamerx@email.com",
  "level": 1,
  "xp": 0,
  ...
}`}
          </CodeBlock>
           <p className="mt-4"><strong className="text-yellow-400">POST /api/withdrawals/initiate</strong>: Processa um pedido de saque.</p>
          <CodeBlock>
{`// Request Body
{
  "userId": 10755083,
  "earningsToWithdraw": 5000
}

// Response
{
  "updatedUser": { ... },
  "transaction": { ... }
}`}
          </CodeBlock>
        </Section>
        
        <Section title="3. Visão Geral da Arquitetura">
            <p><strong>Frontend:</strong> Construído com React, TypeScript e Tailwind CSS, garantindo um código moderno, seguro e de fácil manutenção. A estrutura de componentes é modular e reutilizável.</p>
            <p><strong>Backend (Simulado):</strong> Os serviços em `src/services/` simulam um backend Node.js. Eles operam em um banco de dados em memória (`mockDb.ts`) e expõem funções que o frontend consome como se fossem chamadas de API reais. Isso permite que o desenvolvimento do frontend seja totalmente independente e que a lógica de negócios seja facilmente migrada para um servidor real.</p>
        </Section>
        
        <Section title="4. Estrutura do Banco de Dados">
            <p>O `services/mockDb.ts` simula um banco de dados relacional (como PostgreSQL). As "tabelas" são arrays de objetos e estão prontas para serem convertidas em scripts SQL.</p>
            <h3 className="font-semibold text-lg text-white mt-4">Tabelas Principais:</h3>
            <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-yellow-400">mockUserDatabase</strong>: Armazena todos os dados do usuário, incluindo perfil, carteira e seguidores.</li>
                <li><strong className="text-yellow-400">mockLivesDatabase</strong>: Mantém o registro de todas as transmissões ao vivo, ativas e passadas.</li>
                <li><strong className="text-yellow-400">mockWithdrawalTransactions</strong>: Histórico de todos os saques processados.</li>
            </ul>
        </Section>
        
         <Section title="5. Guia de Instalação">
            <p>O projeto é configurado para ser executado com um único comando, assumindo que Node.js e npm estão instalados.</p>
            <h3 className="font-semibold text-lg text-white mt-4">Passos:</h3>
             <ol className="list-decimal list-inside space-y-2">
                <li>Descompacte os arquivos do projeto.</li>
                <li>Abra um terminal na pasta do projeto.</li>
                <li>Execute <CodeBlock>{`npm install`}</CodeBlock> para instalar as dependências (React).</li>
                <li>Execute <CodeBlock>{`npm run dev`}</CodeBlock> para iniciar o servidor de desenvolvimento.</li>
                <li>Abra o navegador no endereço fornecido pelo terminal.</li>
            </ol>
        </Section>
        
        <Section title="6. Licença de Uso">
            <p>Com a compra, o comprador recebe uma licença perpétua e exclusiva para usar, modificar e distribuir o código-fonte do aplicativo LiveGo para fins comerciais. O vendedor retém o direito de exibir o trabalho em seu portfólio. O código é fornecido "como está", sem garantias.</p>
        </Section>

      </main>
    </div>
  );
};

export default DocumentationScreen;