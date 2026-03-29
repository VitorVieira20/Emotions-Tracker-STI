# 🧠 Affective Learning Engine

Um sistema web de aprendizagem adaptativa desenvolvido para efeitos de investigação académica. O sistema utiliza a webcam para analisar microexpressões faciais em tempo real (como confusão e frustração) e adapta a experiência do utilizador, oferecendo intervenções como dicas contextuais durante um quiz.

Este projeto foi construído com **Next.js**, **Tailwind CSS** e a biblioteca de visão computacional **MediaPipe** da Google.

🔒 **Privacidade Ética:** Todo o processamento biométrico é feito localmente (Client-side) no navegador do utilizador. Nenhuma imagem ou dado em vídeo é guardado ou enviado para servidores externos.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) (para uma gestão fácil da base de dados PostgreSQL)

### Instalação passo a passo

**1. Clonar o repositório**
```bash
git clone https://github.com/VitorVieira20/Emotions-Tracker-STI.git
```

**2. Entrar na pasta do projeto**
```bash
cd Emotions-Tracker-STI
```

**3. Instalar as dependências**
Instala todos os pacotes necessários:
```bash
npm install
```

**4. Configurar Variáveis de Ambiente**
Este projeto necessita de variáveis de ambiente para a ligação à base de dados e para a autenticação. Cria um ficheiro `.env` na raiz do projeto (podes copiar o `.env.example` se existir) e adiciona as seguintes variáveis:

```env
# URL de conexão da tua base de dados PostgreSQL.
DATABASE_URL="postgresql://user:password@localhost:5432/affective-learning"

# Segredo para a autenticação com NextAuth.js.
# Podes gerar um segredo forte executando: openssl rand -hex 32
NEXTAUTH_SECRET="O_TEU_SEGREDO_AQUI"
NEXTAUTH_URL="http://localhost:3000"
```

**5. Inicializar a Base de Dados**
Com o Docker a correr e a tua base de dados PostgreSQL ativa, executa os seguintes comandos para preparar a base de dados com o Prisma:

```bash
# Gera o Prisma Client com base no teu schema
npx prisma generate

# Sincroniza o schema do Prisma com a tua base de dados
npx prisma db push
```

Depois, executa o seeder para popular a base de dados com o banco de questões:
```bash
# Popula a base de dados com as questões de inglês
npx prisma db seed
```
> **Nota:** Este comando `seed` destina-se apenas a carregar o banco de questões de avaliação em inglês, que é essencial para o funcionamento do motor adaptativo. Não cria utilizadores de teste.

**6. Iniciar o projeto**
Finalmente, arranca com a aplicação no teu ambiente de desenvolvimento local:
```bash
npm run dev
```

**7. Aceder à aplicação**
Assim que o servidor iniciar, abre o teu navegador de internet e acede a:
http://localhost:3000

---

## 🛠️ Stack Tecnológica
- **Frontend:** Next.js (App Router & React), Tailwind CSS
- **Backend:** Next.js (Server Actions)
- **Base de Dados:** PostgreSQL com Prisma ORM
- **Autenticação:** NextAuth.js
- **Visão Computacional:** MediaPipe Tasks Vision (Face Landmarker / Blendshapes)