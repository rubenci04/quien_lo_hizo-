import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ChalkboardCanvas from './components/ChalkboardCanvas'
import TriviaBoard from './components/TriviaBoard'
import { goalsList } from './data/goals'

function App() {
  // Aquí guardo cuál gol de la lista estoy mostrando; todo lo demás se deriva de este índice.
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Cambio esta clave al reiniciar para que React desmonte y vuelva a montar la trivia desde cero.
  const [triviaKey, setTriviaKey] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const lastFrame = useRef(0)

  const goal = goalsList[currentGoalIndex]
  const { animation } = goal
  const hasNextGoal = currentGoalIndex < goalsList.length - 1

  // Avanzo el tiempo con requestAnimationFrame mientras esté reproduciendo.
  useEffect(() => {
    if (!playing) return
    lastFrame.current = performance.now()
    let id = requestAnimationFrame(function tick(now) {
      const dt = (now - lastFrame.current) / 1000
      lastFrame.current = now
      setTime((t) => {
        const next = t + dt
        if (next >= animation.duration) {
          setPlaying(false)
          return animation.duration
        }
        return next
      })
      id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [playing, animation.duration])

  const finished = time >= animation.duration

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

  // Paso al siguiente gol: reinicio el estado, oculto la trivia (time vuelve a 0) y lo reproduzco de una vez.
  const nextGoal = () => {
    if (!hasNextGoal) return
    setCurrentGoalIndex((i) => i + 1)
    reset()
    setPlaying(true)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 bg-slate-950 p-4 text-slate-100">
      <h1 className="text-2xl font-bold">¿Quién lo hizo?</h1>

      {/* Al terminar la jugada oscurezco un poco la pizarra con una capa encima del canvas. */}
      <div className="relative">
        <ChalkboardCanvas animationData={animation} currentTime={time} isPlaying={playing} />
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
          max={animation.duration}
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
          key={`${animation.id}-${triviaKey}`}
          questions={goal.questions}
          hints={animation.hints}
          onComplete={setScore}
          onNextGoal={hasNextGoal ? nextGoal : undefined}
        />
      )}
      {score !== null && <p className="sr-only">Puntaje final: {score}</p>}
    </main>
  )
}

export default App
