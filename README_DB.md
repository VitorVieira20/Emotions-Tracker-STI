# Guia de Configuração da Base de Dados (PostgreSQL + Prisma)

Este guia explica como configurar e gerir a base de dados de desenvolvimento local para o projeto "Affective Learning Engine".

## Pré-requisitos

- **Docker:** É necessário ter o Docker e o Docker Compose instalados e em execução na sua máquina.

## Passo a Passo

Siga estes passos para ter o ambiente de desenvolvimento a funcionar:

### 1. Verificar se o Docker está em Execução

Antes de começar, garanta que a aplicação Docker Desktop (ou o Docker daemon) está aberta e a correr no seu sistema.

### 2. Iniciar a Base de Dados

Com o Docker ativo, abra um terminal na raiz do projeto e execute o seguinte comando para iniciar o contentor PostgreSQL em segundo plano (`-d` para *detached mode*):

```bash
docker compose up -d
```

Após a execução, um contentor com a base de dados PostgreSQL estará a correr na sua máquina, acessível na porta `5432`.

### 3. Aplicar o Schema à Base de Dados

O Prisma precisa de sincronizar o schema (`schema.prisma`) com a base de dados, criando as tabelas `User` e `Session`. Para fazer isso, execute:

```bash
npx prisma db push
```

Este comando vai ler o `schema.prisma`, conectarse à base de dados (usando a URL no ficheiro `.env`) e criar a estrutura de tabelas necessária.

### 4. Visualizar os Dados (Opcional)

Para inspecionar, adicionar ou modificar dados diretamente na base de dados através de uma interface gráfica, pode usar o Prisma Studio. Para o iniciar, execute:

```bash
npx prisma studio
```

Isto irá abrir uma nova aba no seu browser (`localhost:5555`) onde poderá ver e gerir os dados das suas tabelas. É uma excelente ferramenta para debugging.

---

Com estes passos, a sua base de dados está pronta e sincronizada com o projeto.
