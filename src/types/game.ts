// Aquí defino todos los tipos del juego en un solo lugar para que el canvas,
// el reproductor y el quiz compartan exactamente el mismo contrato de datos.

/** Punto en coordenadas normalizadas: (0,0) es la esquina superior izquierda de la cancha y (1,1) la inferior derecha. */
export interface Vector2D {
  x: number
  y: number
}

/** Posición de un elemento en un instante concreto; la animación interpola entre estos keyframes. */
export interface KeyframePosition {
  /** Tiempo en segundos desde el inicio de la jugada. */
  t: number
  /** Coordenada horizontal normalizada (0 a 1). */
  x: number
  /** Coordenada vertical normalizada (0 a 1). */
  y: number
}

/** Recorrido de un jugador con su color de equipo opcional (hex o rgb, por ejemplo "#d62828"). */
export interface PlayerTrackData {
  track: KeyframePosition[]
  teamColor?: string
}

/** Jugador secundario (rival o compañero) identificado por id. */
export interface PlayerTrack extends PlayerTrackData {
  id: string
}

/** Pistas opcionales sobre cuándo se marcó el gol. */
export interface GoalHints {
  year?: number
  month?: string
  minute?: number
}

/** Dimensiones reales de la cancha en metros; las uso para dibujar las áreas con proporciones reglamentarias. */
export interface PitchDimensions {
  width: number
  height: number
}

/** Todo lo necesario para animar un gol en la pizarra. */
export interface GoalAnimationData {
  id: string
  title: string
  /** Duración total de la jugada en segundos. */
  duration: number
  pitch: PitchDimensions
  ball: KeyframePosition[]
  players: {
    scorer: PlayerTrackData
    assister?: PlayerTrackData
    others?: PlayerTrack[]
  }
  hints?: GoalHints
}

/** Una pregunta de opción múltiple. */
export interface QuestionData {
  id: string
  prompt: string
  options: string[]
  /** Índice dentro de `options` de la respuesta correcta. */
  correctIndex: number
}

/** Un gol completo: su animación más las tres preguntas (jugador, rival y torneo). */
export interface GoalData {
  animation: GoalAnimationData
  questions: {
    player: QuestionData
    opponent: QuestionData
    tournament: QuestionData
  }
}
