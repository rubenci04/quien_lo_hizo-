import { Check, Lightbulb, Trophy, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { GoalData, GoalHints, QuestionData } from '../types/game'

interface TriviaBoardProps {
  questions: GoalData['questions']
  hints?: GoalHints
  /** Se llama una sola vez al terminar las 3 preguntas, con el puntaje final (0 a 9). */
  onComplete: (score: number) => void
}

// Puntos que vale cada pregunta correcta (3 preguntas x 3 = 9 puntos) y lo que cuesta ver la pista.
const POINTS_PER_QUESTION = 3
const HINT_PENALTY = 1
const MAX_SCORE = POINTS_PER_QUESTION * 3
const NEXT_QUESTION_DELAY_MS = 1500

function formatHints(hints: GoalHints): string {
  const date = [hints.month, hints.year].filter(Boolean).join(' de ')
  const minute = hints.minute !== undefined ? `minuto ${hints.minute}'` : ''
  return [date, minute].filter(Boolean).join(' · ')
}

export default function TriviaBoard({ questions, hints, onComplete }: TriviaBoardProps) {
  // Aquí armo la lista en el orden en que se preguntan: jugador, rival y torneo.
  const list: QuestionData[] = [questions.player, questions.opponent, questions.tournament]

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)

  // Limpio el temporizador si el componente se desmonta (por ejemplo, al reiniciar).
  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const hasHints = hints !== undefined && formatHints(hints) !== ''
  const question = list[index]

  const answer = (optionIndex: number) => {
    // Ignoro clics mientras muestro el resultado de la pregunta actual.
    if (selected !== null) return
    setSelected(optionIndex)

    const isCorrect = optionIndex === question.correctIndex
    const nextCorrect = correctCount + (isCorrect ? 1 : 0)
    if (isCorrect) setCorrectCount(nextCorrect)

    // Espero 1.5 s para que se vea el verde o rojo y luego avanzo o cierro la trivia.
    timeoutRef.current = window.setTimeout(() => {
      if (index === list.length - 1) {
        const score = Math.max(
          0,
          nextCorrect * POINTS_PER_QUESTION - (hintUsed ? HINT_PENALTY : 0),
        )
        setFinalScore(score)
        onComplete(score)
      } else {
        setIndex(index + 1)
        setSelected(null)
      }
    }, NEXT_QUESTION_DELAY_MS)
  }

  const cardClass =
    'rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm shadow-lg'

  if (finalScore !== null) {
    return (
      <section className={`${cardClass} flex flex-col items-center gap-2 text-center`}>
        <Trophy className="size-10 text-yellow-300" />
        <h2 className="text-xl font-bold">Puntaje final</h2>
        <p className="text-4xl font-bold tabular-nums">
          {finalScore} <span className="text-lg text-slate-400">/ {MAX_SCORE}</span>
        </p>
        {hintUsed && (
          <p className="text-sm text-slate-400">Incluye -{HINT_PENALTY} punto por usar la pista.</p>
        )}
      </section>
    )
  }

  return (
    <section className={`${cardClass} flex flex-col gap-3`}>
      <header className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">
          Pregunta {index + 1} de {list.length}
        </span>
        {hasHints && (
          <button
            onClick={() => setHintUsed(true)}
            disabled={hintUsed || selected !== null}
            className="flex items-center gap-1.5 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-200 enabled:hover:bg-yellow-300/20 disabled:cursor-default"
          >
            <Lightbulb className="size-4" />
            {hintUsed ? 'Pista usada' : `Ver Pista (-${HINT_PENALTY} pt)`}
          </button>
        )}
      </header>

      {hintUsed && hints && (
        <p className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-sm text-yellow-100">
          {formatHints(hints)}
        </p>
      )}

      <h2 className="text-lg font-semibold">{question.prompt}</h2>

      <ul className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option, i) => {
          // Aquí elijo el estilo de cada opción: verde si es la correcta, rojo si es la elegida y falló.
          const isCorrect = i === question.correctIndex
          const isChosen = i === selected
          let style = 'border-white/10 bg-white/5 enabled:hover:bg-white/10'
          if (selected !== null && isCorrect) style = 'border-green-400 bg-green-500/30'
          else if (isChosen) style = 'border-red-400 bg-red-500/30'

          return (
            <li key={option}>
              <button
                onClick={() => answer(i)}
                disabled={selected !== null}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left disabled:cursor-default ${style}`}
              >
                {option}
                {selected !== null && isCorrect && <Check className="size-4 text-green-300" />}
                {isChosen && !isCorrect && <X className="size-4 text-red-300" />}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
