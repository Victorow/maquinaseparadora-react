Dashboard de Monitoramento - Máquina Separadora
Este projeto é um dashboard completo para o monitoramento em tempo real da produção de uma máquina separadora industrial. A aplicação, desenvolvida com React Native (Expo) e Node.js, permite visualizar dados agregados, gerar relatórios detalhados e acompanhar as últimas atividades da máquina através de uma interface web e mobile.


✨ Funcionalidades Principais
Dashboard em Tempo Real: Atualização automática dos dados a cada 60 segundos.
Estatísticas de Produção: Visualização do total de peças produzidas no dia e um gráfico de barras com a produção por hora.
Gráficos de Distribuição: Gráficos de pizza interativos que mostram a distribuição da produção por Cor, Tamanho e Material.
Feed de Atividades Recentes: Tabela que exibe em tempo real os últimos itens processados pela máquina.
Relatórios Detalhados: Uma tela dedicada para gerar relatórios com filtros por período.
Exportação de Dados: Funcionalidade para exportar os relatórios detalhados para os formatos CSV e PDF.
Multi-plataforma: Construído com Expo para rodar de forma consistente na Web, Android e iOS a partir de uma única base de código.
🛠️ Tecnologias Utilizadas
Frontend
React Native: Estrutura principal para o desenvolvimento da interface.
Expo: Plataforma para facilitar o desenvolvimento e build do aplicativo.
React Navigation: Para navegação entre telas.
react-native-gifted-charts: Para os gráficos de pizza interativos e customizados.
react-native-chart-kit: Para o gráfico de barras de produção por hora.
expo-print, expo-file-system, expo-sharing: Para as funcionalidades de exportação de PDF e CSV.
Backend
Node.js: Ambiente de execução do servidor.
Express.js: Framework para a construção da API REST.
mysql2/promise: Driver para a comunicação com o banco de dados MySQL de forma assíncrona.
Banco de Dados
MySQL: Sistema de gerenciamento de banco de dados para armazenar todos os dados de produção.
🚀 Como Executar o Projeto
Siga os passos abaixo para configurar e rodar o ambiente de desenvolvimento localmente.

Pré-requisitos
Node.js (versão LTS recomendada)
NPM ou Yarn
Um servidor MySQL em execução
1. Clonar o Repositório
Bash

git clone https://github.com/Victorow/maquinaseparadora-react.git
cd maquinaseparadora-react
2. Configurar o Backend
Bash

# Navegue até a pasta do backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na pasta 'backend' ou altere diretamente no server.js
# com as suas credenciais do MySQL.
# Exemplo de .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=db_prod
Importante: Execute os scripts SQL fornecidos no projeto para criar as tabelas e popular o banco de dados com dados iniciais.

Inicie o servidor backend:


node server.js

# O servidor estará rodando em http://localhost:3000
3. Configurar o Frontend
Bash

# Navegue até a pasta do frontend (a partir da raiz do projeto)
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento do Expo
npx expo start
O Expo abrirá uma aba no navegador. Você pode escanear o QR Code com o app Expo Go no seu celular (Android/iOS) ou pressionar w para abrir a versão web no navegador.
📋 API Endpoints
A API REST do backend oferece os seguintes endpoints:

Método	Rota	Descrição
POST	/api/dashboard-data	Retorna dados agregados para o dashboard do dia.
POST	/api/latest-activities	Retorna as últimas N atividades registradas.
POST	/api/full-report	Retorna um relatório detalhado para um período.
POST	/api/filtered-report	Retorna dados agregados para os gráficos da tela de relatórios.
POST	/api/test-connection	Testa a conexão com o banco de dados.

Exportar para as Planilhas
🗄️ Schema do Banco de Dados
O banco de dados é composto por 4 tabelas principais:

tb_prod: Armazena cada evento de produção com um timestamp e chaves estrangeiras.
id_prod, data_hora, cor, material, tamanho
tb_cor: Tabela de apoio para os nomes das cores.
id_cor, cor
tb_material: Tabela de apoio para os nomes dos materiais.
id_material, material
tb_tamanho: Tabela de apoio para os nomes dos tamanhos.
id_tamanho, tamanho
