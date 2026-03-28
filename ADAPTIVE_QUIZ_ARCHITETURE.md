# Arquitetura do Sistema Adaptativo (Affective Learning Engine)

Este documento descreve o funcionamento do Motor de Teste Adaptativo (Computerized Adaptive Testing - CAT) integrado com biometria facial (Computação Afetiva). O objetivo do sistema é personalizar a experiência de aprendizagem com base no nível de conhecimento do utilizador e no seu estado emocional em tempo real.

---

## 1. O Banco de Perguntas (Item Pool)

Para que o sistema seja dinâmico, as perguntas não podem ser estáticas. O motor precisa de um repositório vasto e bem categorizado. Cada pergunta na base de dados deve conter os seguintes metadados:

* **Nível Global (CEFR):** `A1`, `B1`, `B2` ou `C1`.
* **Área de Conhecimento:** `Reading`, `Listening`, `Grammar`, `Vocabulary`, `Speaking` ou `Writing`.
* **Dificuldade Interna:** `Fácil`, `Média`, ou `Difícil` (Isto representa a dificuldade *dentro* daquele nível específico. Uma pergunta "B2 Difícil" é o teto antes de passar para "C1 Fácil").
* **Conteúdo:** A pergunta, as opções e a indicação da resposta correta.
* **Dica Contextual (Hint):** Um texto de apoio específico para aquela pergunta, desenhado para desbloquear a carga cognitiva do aluno sem lhe dar a resposta diretamente.

---

## 2. O Ponto de Partida (Cold Start Algorithm)

O "Cold Start" resolve o problema de não sabermos exatamente qual o nível de destreza do utilizador no momento zero do quiz. O sistema utiliza os dados do *Onboarding* para definir a primeira pergunta.

### Lógica de Seleção Inicial:
1. **Identificar o Nível do Utilizador:** O sistema lê o nível declarado (ex: `B2`).
2. **Identificar o Foco da Sessão:** O sistema decide se vai testar uma área forte ou fraca. 
   * *Exemplo:* Se o utilizador declarou `Grammar` como `weakArea` e `Vocabulary` como `strongArea`.
3. **Calibrar a Primeira Pergunta:**
   * Se o quiz for sobre a **Área Fraca** (`Grammar`), a primeira pergunta a ser servida será: Nível `B2` + Área `Grammar` + Dificuldade `Fácil`.
   * Se o quiz for sobre a **Área Forte** (`Vocabulary`), a primeira pergunta será: Nível `B2` + Área `Vocabulary` + Dificuldade `Média`.
   
*Objetivo:* Evitar frustração imediata, começando num ponto de conforto adequado às próprias perceções do aluno.

---

## 3. O Motor de Teste Adaptativo (CAT - Regras de Progressão)

O quiz não é gerado de uma só vez. A pergunta N+1 é sempre decidida com base no resultado da pergunta N. Esta é a regra da escada (Step-Rule).

### Como a Dificuldade Sobe (Upward Mobility):
* Se o utilizador acerta a pergunta rapidamente e sem usar dicas:
  * De `Fácil` sobe para `Média`.
  * De `Média` sobe para `Difícil`.
  * Se acertar X perguntas `Difíceis` seguidas no nível `B2`, o sistema transita-o para perguntas do nível `C1 Fácil` (promovendo o estado de *Flow*).

### Como a Dificuldade Desce (Downward Mobility):
* Se o utilizador erra a pergunta:
  * De `Difícil` desce para `Média`.
  * De `Média` desce para `Fácil`.
  * Se errar sucessivamente no nível `Fácil` de `B2`, o sistema serve perguntas de consolidação do nível `B1 Difícil`.

---

## 4. O Casamento com a Biometria (A Intervenção Afetiva)

Esta é a camada académica e inovadora. A progressão não depende *apenas* de estar Certo ou Errado, mas do Custo Cognitivo (Frustração). O sistema lê a webcam continuamente enquanto a pergunta está no ecrã.

### A. O Disparo da Intervenção (Trigger)
1. O motor lê o `frownBase` (Rosto Neutro) e o `frownMax` (Rosto Frustrado) da base de dados.
2. Calcula a percentagem de frustração em tempo real.
3. **Condição:** Se a Frustração > 50% durante um período contínuo de X segundos (ex: 4 segundos) -> **O sistema pausa e mostra o Modal de Dica**.

### B. O Ajuste Dinâmico (Matriz Certo/Errado vs. Emoção)
Quando a resposta é submetida, o sistema cruza o resultado com a emoção predominante para decidir o próximo passo:

* **Certo + Neutro:** Subida normal de dificuldade (O aluno está em controlo).
* **Certo + Frustrado (ou Usou Dica):** Mantém a dificuldade atual. O aluno acertou, mas o custo cognitivo foi alto. Subir a dificuldade agora causaria desistência.
* **Errado + Neutro:** Descida normal de dificuldade (Foi um erro honesto, distração ou falha de conhecimento).
* **Errado + Frustrado (Mesmo após Dica):** Descida imediata de dificuldade E o sistema sinaliza que este subtópico específico precisa de revisão no futuro. A próxima pergunta deve ser significativamente mais fácil para restaurar a autoeficácia do aluno.

---

## 5. Fluxo de Execução do Quiz (Resumo do Loop)

1. **Início:** O Frontend pede ao Backend (Server Action) a primeira pergunta baseada no *Cold Start*.
2. **Monitorização:** A pergunta é renderizada. O MediaPipe inicia o cálculo de `frustPercent`.
3. **Intervenção (Opcional):** Se o limite de frustração é ultrapassado, o frontend mostra o modal de Dica. O estado `hintUsed` passa a `true`.
4. **Submissão:** O utilizador escolhe uma resposta.
5. **Avaliação:** O Frontend envia para o Backend:
   * O ID da pergunta.
   * A resposta escolhida (Certo/Errado).
   * Se a dica foi usada (`true`/`false`).
   * A emoção predominante durante a pergunta (ex: `frustPercent` médio).
6. **Decisão:** O Backend guarda este registo, aplica a matriz de decisão (Ponto 4B) e devolve a pergunta seguinte.
7. **Repetição:** O ciclo repete-se até ao limite de perguntas ou de tempo definido para a sessão.