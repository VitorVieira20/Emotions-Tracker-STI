import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const questions = [
  // B1 - Grammar - Easy
  {
    text: "I haven't seen him ___ last year.",
    options: ["for", "since", "in", "on"],
    correctOption: 1,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Easy",
    hint: "Qual preposição usamos para indicar um ponto de partida específico no tempo? 'For' é usado para durações."
  },
  {
    text: "If I ___ more time, I would learn another language.",
    options: ["have", "had", "will have", "would have"],
    correctOption: 1,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Easy",
    hint: "Esta é uma 'second conditional sentence'. Como formamos a parte da condição (a frase com 'if')?"
  },

  // B1 - Vocabulary - Medium
  {
    text: "She is very ___ and always has a solution for every problem.",
    options: ["resourceful", "reliable", "reluctant", "respective"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Vocabulary",
    difficulty: "Medium",
    hint: "A palavra que procuras descreve alguém que é bom a encontrar soluções inteligentes para os problemas."
  },
  {
    text: "The company decided to ___ its new product line next month.",
    options: ["launch", "sail", "drive", "march"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Vocabulary",
    difficulty: "Medium",
    hint: "Qual verbo significa 'introduzir um novo produto no mercado'?"
  },

  // B2 - Grammar - Medium
  {
    text: "By the time we arrived, the movie ___ already started.",
    options: ["has", "have", "had", "was"],
    correctOption: 2,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Precisas do Past Perfect aqui para mostrar que uma ação no passado aconteceu antes de outra."
  },
  {
    text: "He is known for ___ his temper easily.",
    options: ["losing", "lost", "lose", "to lose"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Depois de uma preposição como 'for', que forma do verbo devemos usar?"
  },
  {
    text: "Never ___ such a beautiful sunset.",
    options: ["I have seen", "have I seen", "I saw", "did I see"],
    correctOption: 1,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Hard",
    hint: "Isto é uma 'inversion'. Quando uma frase começa com uma expressão negativa como 'Never', o que acontece à ordem do sujeito e do verbo auxiliar?"
  },

  // B2 - Vocabulary - Hard
  {
    text: "The new evidence will ___ the previous theories.",
    options: ["undermine", "underline", "undertake", "undergo"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "Qual palavra significa 'enfraquecer' ou 'pôr em causa' algo, como uma teoria ou autoridade?"
  },
  {
    text: "Despite the initial setbacks, they ___ and completed the project.",
    options: ["persevered", "perceived", "presided", "persuaded"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra certa descreve a ação de continuar a tentar fazer algo apesar das dificuldades."
  },
  
  // C1 - Grammar - Hard
  {
    text: "___ I known you were coming, I would have baked a cake.",
    options: ["If", "Should", "Were", "Had"],
    correctOption: 3,
    cefrLevel: "C1",
    area: "Grammar",
    difficulty: "Hard",
    hint: "Esta é uma forma avançada e invertida da 'third conditional'. O 'if' é omitido e o verbo auxiliar move-se para o início."
  },
  {
    text: "The report is due tomorrow, ___ means we have to work overnight.",
    options: ["that", "which", "what", "it"],
    correctOption: 1,
    cefrLevel: "C1",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Qual pronome relativo é usado para se referir a toda a ideia da frase anterior?"
  },
  {
    text: "Not only ___ the exam, but he also got the highest score.",
    options: ["he passed", "did he pass", "he has passed", "he did pass"],
    correctOption: 1,
    cefrLevel: "C1",
    area: "Grammar",
    difficulty: "Hard",
    hint: "Tal como 'Never', 'Not only' no início de uma frase causa uma inversão do sujeito e do verbo auxiliar."
  },

  // C1 - Vocabulary - Hard
  {
    text: "His ___ arguments were so convincing that everyone agreed with his proposal.",
    options: ["cogent", "fallacious", "trivial", "superficial"],
    correctOption: 0,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra que procuras significa 'claro, lógico e convincente'."
  },
  {
    text: "The team's morale was low, and the manager's speech did little to ___ the situation.",
    options: ["exacerbate", "ameliorate", "alleviate", "mitigate"],
    correctOption: 1,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "Enquanto 'exacerbate' significa piorar, as outras três opções significam melhorar ou aliviar. Qual delas é a mais formal para 'melhorar uma situação'?"
  },

  // More B1 Questions
  {
    text: "You ___ finish the report by Friday.",
    options: ["must", "can", "would", "did"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Easy",
    hint: "Qual verbo modal usamos para expressar uma obrigação forte ou uma ordem?"
  },
  {
    text: "I'm not very good ___ sports.",
    options: ["in", "on", "at", "with"],
    correctOption: 2,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Que preposição se usa depois de 'good' para indicar habilidade em algo?"
  },
  {
    text: "He couldn't attend the meeting due to a ___ engagement.",
    options: ["prior", "premium", "primary", "private"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra significa 'anterior' ou 'que veio antes'. 'A prior engagement' é um compromisso prévio."
  },

  // More B2 Questions
  {
    text: "I wish I ___ studied harder for the test.",
    options: ["had", "have", "would", "did"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Para expressar arrependimento sobre o passado com 'I wish', usamos o Past Perfect."
  },
  {
    text: "The issue was so ___ that it required a team of experts to solve it.",
    options: ["intricate", "internal", "intimate", "intrinsic"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra certa significa 'muito complicado ou detalhado'."
  },
  {
    text: "It is widely ___ that the Earth is getting warmer.",
    options: ["acknowledged", "acquainted", "acquired", "addressed"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Vocabulary",
    difficulty: "Medium",
    hint: "Qual verbo significa 'reconhecer' ou 'aceitar como verdadeiro'?"
  },
  
  // More C1 Questions
  {
    text: "The politician's speech was full of ___ and empty promises.",
    options: ["platitudes", "altitudes", "aptitudes", "solitudes"],
    correctOption: 0,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Medium",
    hint: "A palavra descreve uma observação ou comentário que foi usado tantas vezes que já não tem significado ou interesse."
  },
  {
    text: "The artist was known for his ___ use of color.",
    options: ["judicious", "judicial", "jurisprudent", "juridical"],
    correctOption: 0,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra que procuras significa 'feito com bom senso ou julgamento'."
  },
  {
    text: "___ the bad weather, the event was a resounding success.",
    options: ["Despite", "Although", "However", "In spite"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Hard",
    hint: "'Despite' e 'In spite of' são seguidos por um substantivo. 'Although' é seguido por uma oração (sujeito + verbo)."
  },
  {
    text: "I am not accustomed ___ in such a noisy environment.",
    options: ["to working", "to work", "for working", "with working"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Medium",
    hint: "A expressão 'to be accustomed to' é seguida por um gerúndio (verbo + -ing)."
  },
  {
    text: "The more you practice, ___ you will become.",
    options: ["the better", "the best", "better", "good"],
    correctOption: 0,
    cefrLevel: "B1",
    area: "Grammar",
    difficulty: "Medium",
    hint: "Esta estrutura comparativa é 'The + comparativo, the + comparativo'."
  },
  {
    text: "The problem is ___ to be solved in a day.",
    options: ["too complex", "so complex", "very complex", "complex enough"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Grammar",
    difficulty: "Easy",
    hint: "A estrutura 'too + adjetivo + to + infinitivo' é usada para indicar que algo é excessivo."
  },
  {
    text: "She has a ___ for spotting talent.",
    options: ["knack", "crack", "snack", "track"],
    correctOption: 0,
    cefrLevel: "B2",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra que procuras significa 'um talento ou habilidade especial'."
  },
  {
    text: "The new regulations are designed to ___ innovation.",
    options: ["foster", "fester", "falter", "founder"],
    correctOption: 0,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Medium",
    hint: "Qual verbo significa 'encorajar' ou 'promover o desenvolvimento de algo'?"
  },
  {
    text: "It is imperative that he ___ the meeting.",
    options: ["attend", "attends", "attended", "to attend"],
    correctOption: 0,
    cefrLevel: "C1",
    area: "Grammar",
    difficulty: "Hard",
    hint: "Esta é a forma subjuntiva. Depois de expressões como 'it is imperative/essential/vital that', o verbo fica na sua forma base (infinitivo sem 'to')."
  },
  {
    text: "The lawyer's arguments were so ___ that the jury was convinced of his client's innocence.",
    options: ["tenuous", "plausible", "specious", "fallacious"],
    correctOption: 1,
    cefrLevel: "C1",
    area: "Vocabulary",
    difficulty: "Hard",
    hint: "A palavra que procuras significa 'credível' ou 'aparentemente verdadeiro'. As outras opções têm conotações negativas (fraco, enganador)."
  },
];

async function main() {
  console.log('Start seeding...');

  await prisma.question.deleteMany();
  console.log('Deleted existing questions.');

  const result = await prisma.question.createMany({
    data: questions,
    skipDuplicates: true,
  });

  console.log(`Successfully created ${result.count} new questions.`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
