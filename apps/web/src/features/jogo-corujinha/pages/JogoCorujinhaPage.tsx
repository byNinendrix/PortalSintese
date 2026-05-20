import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual animal simboliza sabedoria e também é mascote do SINTESE?",
    options: ["Coruja", "Leão", "Cavalo", "Peixe"],
    correctAnswer: "Coruja"
  },
  {
    id: 2,
    question: "Qual é uma ferramenta essencial no trabalho do professor?",
    options: ["Planejamento", "Capacete", "Chave inglesa", "Bússola náutica"],
    correctAnswer: "Planejamento"
  },
  {
    id: 3,
    question: "O que fortalece a escola pública?",
    options: [
      "Valorização dos profissionais da educação",
      "Falta de diálogo",
      "Desorganização",
      "Isolamento"
    ],
    correctAnswer: "Valorização dos profissionais da educação"
  },
  {
    id: 4,
    question: "Qual ambiente representa o dia a dia da educação?",
    options: ["Sala de aula", "Aeroporto", "Oficina mecânica", "Estádio"],
    correctAnswer: "Sala de aula"
  },
  {
    id: 5,
    question: "Qual item combina com estudo e aprendizagem?",
    options: ["Livro", "Martelo", "Volante", "Tijolo"],
    correctAnswer: "Livro"
  },
  {
    id: 6,
    question: "O que ajuda uma categoria profissional a conquistar direitos?",
    options: ["União e organização", "Individualismo", "Silêncio permanente", "Falta de informação"],
    correctAnswer: "União e organização"
  },
  {
    id: 7,
    question: "Qual palavra combina com a missão de educar?",
    options: ["Conhecimento", "Descaso", "Improviso eterno", "Desinformação"],
    correctAnswer: "Conhecimento"
  },
  {
    id: 8,
    question: "O que representa respeito ao professor e à professora?",
    options: ["Valorização profissional", "Salário atrasado", "Falta de estrutura", "Sobrecarga sem diálogo"],
    correctAnswer: "Valorização profissional"
  },
  {
    id: 9,
    question: "Qual atitude favorece um ambiente escolar acolhedor?",
    options: ["Escuta ativa", "Ironia constante", "Indiferença", "Falta de respeito"],
    correctAnswer: "Escuta ativa"
  },
  {
    id: 10,
    question: "Qual prática ajuda no aprendizado contínuo?",
    options: ["Leitura frequente", "Desinformação", "Negligência", "Improviso sem planejamento"],
    correctAnswer: "Leitura frequente"
  },
  {
    id: 11,
    question: "Em sala, o que melhora a participação dos estudantes?",
    options: ["Diálogo e interação", "Monólogo sem pausas", "Ausência de escuta", "Desorganização"],
    correctAnswer: "Diálogo e interação"
  },
  {
    id: 12,
    question: "Qual recurso pode apoiar o ensino de forma criativa?",
    options: ["Projetos interdisciplinares", "Falta de planejamento", "Desmotivação", "Isolamento"],
    correctAnswer: "Projetos interdisciplinares"
  },
  {
    id: 13,
    question: "Qual valor fortalece o trabalho coletivo da educação?",
    options: ["Cooperação", "Competição nociva", "Desunião", "Desrespeito"],
    correctAnswer: "Cooperação"
  },
  {
    id: 14,
    question: "O que contribui para a qualidade da escola pública?",
    options: ["Formação continuada", "Corte de diálogo", "Desinformação", "Desvalorização"],
    correctAnswer: "Formação continuada"
  },
  {
    id: 15,
    question: "Qual postura apoia a inclusão no ambiente escolar?",
    options: ["Respeito às diferenças", "Preconceito", "Exclusão", "Indiferença"],
    correctAnswer: "Respeito às diferenças"
  },
  {
    id: 16,
    question: "Qual elemento é essencial para uma boa aula?",
    options: ["Objetivo claro", "Falta de foco", "Improviso permanente", "Desorganização"],
    correctAnswer: "Objetivo claro"
  },
  {
    id: 17,
    question: "O que ajuda a reduzir conflitos na escola?",
    options: ["Comunicação respeitosa", "Agressividade", "Silêncio forçado", "Falta de empatia"],
    correctAnswer: "Comunicação respeitosa"
  },
  {
    id: 18,
    question: "Qual iniciativa fortalece os direitos da categoria?",
    options: ["Participação sindical", "Isolamento total", "Desmobilização", "Falta de organização"],
    correctAnswer: "Participação sindical"
  },
  {
    id: 19,
    question: "Qual hábito melhora o acompanhamento da turma?",
    options: ["Avaliação formativa", "Ausência de registro", "Falta de retorno", "Desinteresse"],
    correctAnswer: "Avaliação formativa"
  },
  {
    id: 20,
    question: "Qual palavra resume a força da educação pública?",
    options: ["Transformação", "Retrocesso", "Descaso", "Desunião"],
    correctAnswer: "Transformação"
  }
];

type GameStep = "intro" | "playing" | "result";

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function buildGameQuestions(previousOrderSignature?: string): QuizQuestion[] {
  const build = () =>
    shuffleArray(QUIZ_QUESTIONS).map((question) => ({
      ...question,
      options: shuffleArray(question.options)
    }));

  let nextQuestions = build();
  if (!previousOrderSignature) {
    return nextQuestions;
  }

  let nextSignature = nextQuestions.map((question) => question.id).join("-");
  let attempts = 0;

  while (nextSignature === previousOrderSignature && attempts < 12) {
    nextQuestions = build();
    nextSignature = nextQuestions.map((question) => question.id).join("-");
    attempts += 1;
  }

  if (nextSignature === previousOrderSignature && nextQuestions.length > 1) {
    const [first, ...rest] = nextQuestions;
    return [...rest, first];
  }

  return nextQuestions;
}

function getQuestionsOrderSignature(questions: QuizQuestion[]): string {
  return questions.map((question) => question.id).join("-");
}

export function JogoCorujinhaPage() {
  const [step, setStep] = useState<GameStep>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [gameQuestions, setGameQuestions] = useState<QuizQuestion[]>(() => buildGameQuestions());
  const [lastQuestionsOrder, setLastQuestionsOrder] = useState<string>("");

  const currentQuestion = gameQuestions[currentIndex] ?? null;
  const totalQuestions = gameQuestions.length;
  const scorePercent = useMemo(() => Math.round((score / totalQuestions) * 100), [score, totalQuestions]);
  const canAdvance = step === "playing" && selectedOption !== null;

  function startGame() {
    const previousOrder = lastQuestionsOrder || getQuestionsOrderSignature(gameQuestions);
    const nextQuestions = buildGameQuestions(previousOrder);
    setGameQuestions(nextQuestions);
    setLastQuestionsOrder(getQuestionsOrderSignature(nextQuestions));
    setStep("playing");
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback("");
  }

  function handleAnswer(option: string) {
    if (!currentQuestion || selectedOption) {
      return;
    }

    const isCorrect = option === currentQuestion.correctAnswer;
    setSelectedOption(option);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setFeedback("Corujinha aprova: resposta correta! Muito bem.");
      return;
    }

    setFeedback(`Resposta amigável da Corujinha: a correta era "${currentQuestion.correctAnswer}".`);
  }

  function handleNext() {
    if (!canAdvance) {
      return;
    }

    const isLast = currentIndex >= totalQuestions - 1;
    if (isLast) {
      setStep("result");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setFeedback("");
  }

  function restartGame() {
    startGame();
  }

  function getResultMessage() {
    if (scorePercent >= 70) {
      return "Parabéns! A Corujinha reconhece seu conhecimento e sua energia educadora.";
    }
    if (scorePercent >= 40) {
      return "Muito bem! O importante é participar, aprender e seguir valorizando a educação.";
    }
    return "Valeu pela participação! A Corujinha convida você para tentar novamente.";
  }

  return (
    <section className="auth-card-modern w-full max-w-[760px]">
      <header className="mb-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">Corujinha do SINTESE</p>
        <h1 className="section-title mt-2">Desafio da Corujinha</h1>
      </header>

      {step === "intro" ? (
        <div className="space-y-4 text-center">
          <p className="mx-auto max-w-[620px] text-sm leading-relaxed text-slate-700 sm:text-base">
            Um momento leve para professoras e professores relaxarem antes de acessar o portal.
          </p>
          <p className="mx-auto max-w-[620px] text-sm leading-relaxed text-slate-600 sm:text-base">
            Responda, pontue e relaxe um pouco antes de acessar o portal.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="btn-modern-primary w-full" onClick={startGame}>
              Iniciar Jogo
            </Button>
            <Link to="/login" className="block">
              <Button type="button" className="btn-modern-danger w-full">
                Voltar ao Portal
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {step === "playing" && currentQuestion ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
            <p className="text-sm font-semibold text-slate-700">
              Pergunta {currentIndex + 1} de {totalQuestions}
            </p>
            <p className="text-sm font-semibold text-slate-700 sm:text-right">Pontuação: {score}</p>
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-bold leading-relaxed text-slate-900 sm:text-lg">{currentQuestion.question}</h2>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showState = selectedOption !== null;
                const stateClass = showState
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : isSelected
                      ? "border-rose-500 bg-rose-50 text-rose-900"
                      : "border-slate-200 bg-white text-slate-700"
                  : "border-slate-300 bg-white text-slate-800 hover:border-sky-500";

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswer(option)}
                    disabled={selectedOption !== null}
                    aria-pressed={isSelected}
                    className={`min-h-12 w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold leading-relaxed outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 ${stateClass} ${selectedOption ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </article>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" aria-live="polite">
            <p className="text-sm font-semibold text-slate-700">{feedback || "Selecione uma alternativa para continuar."}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="btn-modern-primary w-full" onClick={handleNext} disabled={!canAdvance}>
              {currentIndex >= totalQuestions - 1 ? "Ver resultado" : "Próxima pergunta"}
            </Button>
            <Link to="/login" className="block">
              <Button type="button" className="btn-modern-danger w-full">
                Voltar ao Portal
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {step === "result" ? (
        <div className="space-y-4 text-center">
          <h2 className="section-title">Resultado Final</h2>
          <p className="text-base font-semibold text-slate-800">
            Você fez {score} de {totalQuestions} pontos.
          </p>
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
            {getResultMessage()}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="btn-modern-primary w-full" onClick={restartGame}>
              Jogar novamente
            </Button>
            <Link to="/login" className="block">
              <Button type="button" className="btn-modern-danger w-full">
                Voltar ao Portal
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
