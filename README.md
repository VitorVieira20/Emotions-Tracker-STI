# 🧠 Affective Learning Engine

Um sistema web de aprendizagem adaptativa desenvolvido para efeitos de investigação académica. O sistema utiliza a webcam para analisar microexpressões faciais em tempo real (como confusão e frustração) e adapta a experiência do utilizador, oferecendo intervenções como dicas contextuais durante um quiz.

Este projeto foi construído com **Next.js**, **Tailwind CSS** e a biblioteca de visão computacional **MediaPipe** da Google.

🔒 **Privacidade Ética:** Todo o processamento biométrico é feito localmente (Client-side) no navegador do utilizador. Nenhuma imagem ou dado em vídeo é guardado ou enviado para servidores externos.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Certifica-te de que tens o [Node.js](https://nodejs.org/) e o [Git](https://git-scm.com/) instalados na tua máquina.

### Instalação passo a passo

**1. Clonar o repositório**
Abre o teu terminal e executa o seguinte comando para transferir o projeto para o teu computador:
```bash
git clone https://github.com/VitorVieira20/Emotions-Tracker-STI.git
```

**2. Entrar na pasta do projeto**
```bash
cd Emotions-Tracker-STI
```

**3. Instalar as dependências**
Instala todos os pacotes necessários (como o Next.js, MediaPipe, Lucide Icons, etc.):
```bash
npm install
```

**4. Iniciar o projeto**
Arranca com a aplicação no teu ambiente local:
```bash
npm run dev
```

**5. Aceder à aplicação**
Assim que o servidor iniciar, abre o teu navegador de internet (recomenda-se Google Chrome ou Microsoft Edge) e acede a:
http://localhost:3000

---

## 🛠️ Stack Tecnológica
- **Next.js** (App Router & React)
- **Tailwind CSS** (Styling)
- **MediaPipe Tasks Vision** (Face Landmarker / Blendshapes)