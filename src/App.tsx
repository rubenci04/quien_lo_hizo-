import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ChalkboardCanvas from './components/ChalkboardCanvas'
import TriviaBoard from './components/TriviaBoard'
import type { GoalAnimationData, GoalData } from './types/game'

// Gol de ejemplo: ataque hacia el arco derecho (x = 1), con asistencia, rivales y colores de equipo.
const demoGoal: GoalAnimationData = {
  id: 'demo-1',
  title: 'Gol de ejemplo',
  duration: 6,
  pitch: { width: 105, height: 68 },
  ball: [
    { t: 0, x: 0.45, y: 0.7 },
    { t: 1.5, x: 0.6, y: 0.8 },
    { t: 3, x: 0.78, y: 0.6 },
    { t: 4.2, x: 0.86, y: 0.45 },
    { t: 5, x: 0.99, y: 0.5 },
    { t: 6, x: 1, y: 0.5 },
  ],
  players: {
    // Celeste para el goleador y su compañero; rojo para los rivales.
    scorer: {
      teamColor: '#75aadb',
      track: [
        { t: 0, x: 0.6, y: 0.4 },
        { t: 3, x: 0.78, y: 0.45 },
        { t: 4.2, x: 0.86, y: 0.45 },
        { t: 6, x: 0.9, y: 0.5 },
      ],
    },
    assister: {
      teamColor: '#75aadb',
      track: [
        { t: 0, x: 0.45, y: 0.7 },
        { t: 3, x: 0.7, y: 0.65 },
        { t: 6, x: 0.8, y: 0.6 },
      ],
    },
    others: [
      {
        id: 'rival-1',
        teamColor: '#d62828',
        track: [
          { t: 0, x: 0.7, y: 0.6 },
          { t: 6, x: 0.82, y: 0.5 },
        ],
      },
      {
        id: 'rival-2',
        teamColor: '#d62828',
        track: [
          { t: 0, x: 0.85, y: 0.3 },
          { t: 6, x: 0.9, y: 0.4 },
        ],
      },
    ],
  },
  // Pistas ficticias para la trivia.
  hints: { year: 2019, month: 'Marzo', minute: 67 },
}

// Preguntas ficticias de prueba.
const demoQuestions: GoalData['questions'] = {
  player: {
    id: 'q-player',
    prompt: '¿Quién marcó el gol?',
    options: ['Jugador A', 'Jugador B', 'Jugador C', 'Jugador D'],
    correctIndex: 1,
  },
  opponent: {
    id: 'q-opponent',
    prompt: '¿Contra qué rival se marcó?',
    options: ['Rival A', 'Rival B', 'Rival C', 'Rival D'],
    correctIndex: 2,
  },
  tournament: {
    id: 'q-tournament',
    prompt: '¿En qué torneo fue el gol?',
    options: ['Torneo A', 'Torneo B', 'Torneo C', 'Torneo D'],
    correctIndex: 0,
  },
}

function App() {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Cambio esta clave al reiniciar para que React desmonte y vuelva a montar la trivia desde cero.
  const [triviaKey, setTriviaKey] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const lastFrame = useRef(0)

  // Avanzo el tiempo con requestAnimationFrame mientras esté reproduciendo.
  useEffect(() => {
    if (!playing) return
    lastFrame.current = performance.now()
    let id = requestAnimationFrame(function tick(now) {
      const dt = (now - lastFrame.current) / 1000
      lastFrame.current = now
      setTime((t) => {
        const next = t + dt
        if (next >= demoGoal.duration) {
          setPlaying(false)
          return demoGoal.duration
        }
        return next
      })
      id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [playing])

  const finished = time >= demoGoal.duration

  const reset = () => {
    setPlaying(false)
    setTime(0)
    setScore(null)
    setTriviaKey((k) => k + 1)
  }

  const togglePlay = () => {
    // Si ya terminó, reinicio todo (incluida la trivia) antes de reproducir.
    if (!playing && finished) {
      reset()
      setPlaying(true)
      return
    }
    setPlaying((p) => !p)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 bg-slate-950 p-4 text-slate-100">
      <h1 className="text-2xl font-bold">¿Quién lo hizo?</h1>

      {/* Al terminar la jugada oscurezco un poco la pizarra con una capa encima del canvas. */}
      <div className="relative">
        <ChalkboardCanvas animationData={demoGoal} currentTime={time} isPlaying={playing} />
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl bg-black/45 transition-opacity duration-500 ${
            finished ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="rounded-full bg-indigo-500 p-2 hover:bg-indigo-400"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button
          onClick={reset}
          aria-label="Reiniciar"
          className="rounded-full bg-slate-700 p-2 hover:bg-slate-600"
        >
          <RotateCcw className="size-5" />
        </button>
        <input
          type="range"
          min={0}
          max={demoGoal.duration}
          step={0.01}
          value={time}
          onChange={(e) => {
            setPlaying(false)
            setTime(Number(e.target.value))
          }}
          aria-label="Tiempo de la jugada"
          className="flex-1"
        />
        <span className="w-16 text-right tabular-nums">{time.toFixed(1)} s</span>
      </div>

      {finished && (
        <TriviaBoard
          key={triviaKey}
          questions={demoQuestions}
          hints={demoGoal.hints}
          onComplete={setScore}
        />
      )}
      {score !== null && <p className="sr-only">Puntaje final: {score}</p>}
    </main>
  )
}

export default App
