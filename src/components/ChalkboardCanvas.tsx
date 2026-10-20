import { useEffect, useRef, useState } from 'react'
import type {
  GoalAnimationData,
  KeyframePosition,
  PitchDimensions,
  Vector2D,
} from '../types/game'

interface ChalkboardCanvasProps {
  animationData: GoalAnimationData
  /** Tiempo actual de la jugada en segundos. */
  currentTime: number
  isPlaying: boolean
}

// Margen (en metros) que dejo alrededor de la cancha para que las líneas no toquen el borde.
const BOARD_MARGIN = 4

// Paleta de tiza: todos los colores semi-transparentes para simular polvo de tiza sobre la pizarra.
const COLORS = {
  board: '#1b382b',
  line: 'rgba(255, 255, 255, 0.72)',
  trail: 'rgba(255, 255, 255, 0.55)',
  ball: '#fffdf2',
  scorer: '#ffd84d',
  assister: '#7fd8ff',
  other: 'rgba(255, 255, 255, 0.85)',
} as const

// ---------------------------------------------------------------------------
// Interpolación
// ---------------------------------------------------------------------------

/** Interpolación lineal clásica entre dos números. */
function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k
}

/**
 * Devuelve la posición interpolada de un recorrido en el tiempo `t`.
 * Asumo que los keyframes vienen ordenados por `t`; fuera de rango fijo la posición en los extremos.
 */
function interpolateTrack(
  track: KeyframePosition[],
  t: number,
): Vector2D | null {
  if (track.length === 0) return null

  // Antes del primer keyframe o después del último, me quedo en el extremo.
  const first = track[0]
  const last = track[track.length - 1]
  if (t <= first.t) return { x: first.x, y: first.y }
  if (t >= last.t) return { x: last.x, y: last.y }

  // Aquí busco con búsqueda binaria el tramo [lo, lo+1] que contiene a `t`.
  let lo = 0
  let hi = track.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (track[mid].t <= t) lo = mid
    else hi = mid
  }

  // Aquí calculo la posición interpolada: k es el avance (0 a 1) dentro del tramo.
  const a = track[lo]
  const b = track[hi]
  const span = b.t - a.t
  const k = span > 0 ? (t - a.t) / span : 1
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }
}

// ---------------------------------------------------------------------------
// Utilidades de dibujo
// ---------------------------------------------------------------------------

/** Generador pseudoaleatorio con semilla (mulberry32): así el "temblor" de la tiza es estable y no parpadea. */
function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Geometría del tablero: convierte coordenadas normalizadas o en metros a píxeles CSS. */
interface Board {
  /** Píxeles por metro. */
  scale: number
  /** Esquina superior izquierda de la cancha en píxeles. */
  originX: number
  originY: number
  pitch: PitchDimensions
}

function createBoard(cssWidth: number, pitch: PitchDimensions): Board {
  const scale = cssWidth / (pitch.width + BOARD_MARGIN * 2)
  return {
    scale,
    originX: BOARD_MARGIN * scale,
    originY: BOARD_MARGIN * scale,
    pitch,
  }
}

function toPixels(board: Board, p: Vector2D): Vector2D {
  return {
    x: board.originX + p.x * board.pitch.width * board.scale,
    y: board.originY + p.y * board.pitch.height * board.scale,
  }
}

/** Trazo rugoso: dibujo la misma trayectoria varias veces con pequeñas desviaciones para imitar la tiza. */
function chalkStroke(
  ctx: CanvasRenderingContext2D,
  buildPath: () => void,
  rng: () => number,
  width: number,
): void {
  // Configuro el estilo de trazo simulando tiza: punta redondeada y baja opacidad por pasada.
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = COLORS.line

  const passes = 3
  for (let i = 0; i < passes; i++) {
    ctx.save()
    // Cada pasada se desplaza y adelgaza un poco distinto, y eso da el aspecto semi-rugoso.
    ctx.translate((rng() - 0.5) * width * 0.6, (rng() - 0.5) * width * 0.6)
    ctx.lineWidth = width * (0.55 + rng() * 0.5)
    ctx.globalAlpha = 0.45 + rng() * 0.3
    ctx.beginPath()
    buildPath()
    ctx.stroke()
    ctx.restore()
  }
}

/** Fondo de pizarra: color base, viñeta suave, polvo de tiza y rayas tenues de borrador. */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: () => number,
): void {
  // Pinto el color base y una viñeta radial para que los bordes se vean más oscuros.
  ctx.fillStyle = COLORS.board
  ctx.fillRect(0, 0, w, h)
  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.2,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  )
  // Interpolo entre tonos verdes (no blanco) para que el degradado no se lave hacia gris.
  vignette.addColorStop(0, 'rgba(60, 110, 85, 0.18)')
  vignette.addColorStop(1, 'rgba(10, 25, 18, 0.65)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  // Aquí esparzo motas diminutas para dar textura de pizarra.
  const specks = Math.floor((w * h) / 350)
  for (let i = 0; i < specks; i++) {
    ctx.globalAlpha = 0.03 + rng() * 0.05
    ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000'
    ctx.fillRect(rng() * w, rng() * h, 1 + rng(), 1 + rng())
  }

  // Y trazo unas pocas rayas largas muy tenues, como restos del borrador.
  ctx.strokeStyle = '#ffffff'
  ctx.lineCap = 'round'
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.004 + rng() * 0.008
    ctx.lineWidth = 10 + rng() * 22
    const y = rng() * h
    ctx.beginPath()
    ctx.moveTo(rng() * w * 0.3, y)
    ctx.lineTo(w * (0.6 + rng() * 0.4), y + (rng() - 0.5) * h * 0.1)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Marcado reglamentario de la cancha. Todas las medidas están en metros y las convierto con `scale`. */
function drawPitchMarkings(
  ctx: CanvasRenderingContext2D,
  board: Board,
  rng: () => number,
): void {
  const { scale, originX: ox, originY: oy, pitch } = board
  const L = pitch.width * scale
  const W = pitch.height * scale
  const lineWidth = Math.max(1.5, scale * 0.28)
  const cx = ox + L / 2
  const cy = oy + W / 2

  const stroke = (build: () => void) => chalkStroke(ctx, build, rng, lineWidth)

  // Perímetro y línea de medio campo.
  stroke(() => ctx.rect(ox, oy, L, W))
  stroke(() => {
    ctx.moveTo(cx, oy)
    ctx.lineTo(cx, oy + W)
  })

  // Círculo central (radio reglamentario 9.15 m) y punto central.
  const centerRadius = 9.15 * scale
  stroke(() => ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2))
  stroke(() => ctx.arc(cx, cy, lineWidth * 0.9, 0, Math.PI * 2))

  // Dimensiones reglamentarias de las áreas y el arco.
  const bigBoxDepth = 16.5 * scale
  const bigBoxWidth = 40.32 * scale
  const smallBoxDepth = 5.5 * scale
  const smallBoxWidth = 18.32 * scale
  const goalWidth = 7.32 * scale
  const goalDepth = 2.4 * scale
  const penaltySpot = 11 * scale

  // Dibujo los dos lados con la misma función; `dir` es 1 para el lado izquierdo y -1 para el derecho.
  const drawSide = (lineX: number, dir: 1 | -1) => {
    // Área grande y área chica.
    stroke(() =>
      ctx.rect(
        dir === 1 ? lineX : lineX - bigBoxDepth,
        cy - bigBoxWidth / 2,
        bigBoxDepth,
        bigBoxWidth,
      ),
    )
    stroke(() =>
      ctx.rect(
        dir === 1 ? lineX : lineX - smallBoxDepth,
        cy - smallBoxWidth / 2,
        smallBoxDepth,
        smallBoxWidth,
      ),
    )
    // Arco, dibujado hacia afuera de la línea de meta.
    stroke(() =>
      ctx.rect(
        dir === 1 ? lineX - goalDepth : lineX,
        cy - goalWidth / 2,
        goalDepth,
        goalWidth,
      ),
    )
    // Punto de penal y media luna del área: el arco de 9.15 m desde el punto, solo la parte fuera del área grande.
    const spotX = lineX + dir * penaltySpot
    stroke(() => ctx.arc(spotX, cy, lineWidth * 0.9, 0, Math.PI * 2))
    const halfAngle = Math.acos((bigBoxDepth - penaltySpot) / centerRadius)
    stroke(() => {
      if (dir === 1) ctx.arc(spotX, cy, centerRadius, -halfAngle, halfAngle)
      else ctx.arc(spotX, cy, centerRadius, Math.PI - halfAngle, Math.PI + halfAngle)
    })
  }
  drawSide(ox, 1)
  drawSide(ox + L, -1)

  // Cuartos de círculo de los córners (radio 1 m).
  const cornerRadius = 1 * scale
  stroke(() => ctx.arc(ox, oy, cornerRadius, 0, Math.PI / 2))
  stroke(() => ctx.arc(ox + L, oy, cornerRadius, Math.PI / 2, Math.PI))
  stroke(() => ctx.arc(ox + L, oy + W, cornerRadius, Math.PI, Math.PI * 1.5))
  stroke(() => ctx.arc(ox, oy + W, cornerRadius, Math.PI * 1.5, Math.PI * 2))
}

/** Capa estática (fondo + cancha): la dibujo una sola vez por tamaño y la reutilizo en cada frame. */
function renderStaticLayer(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  board: Board,
): HTMLCanvasElement {
  const layer = document.createElement('canvas')
  layer.width = Math.round(cssWidth * dpr)
  layer.height = Math.round(cssHeight * dpr)
  const ctx = layer.getContext('2d')
  if (!ctx) return layer
  ctx.scale(dpr, dpr)

  // Uso una semilla fija para que la textura sea idéntica entre renderizados.
  const rng = createRng(1337)
  drawBackground(ctx, cssWidth, cssHeight, rng)
  drawPitchMarkings(ctx, board, rng)
  return layer
}

/** Estela de la pelota: tramos ya recorridos hasta `currentTime`, más el tramo en curso hasta la pelota. */
function drawBallTrail(
  ctx: CanvasRenderingContext2D,
  board: Board,
  ball: KeyframePosition[],
  currentTime: number,
  current: Vector2D,
): void {
  // Aquí recopilo los keyframes ya alcanzados y cierro la línea en la posición interpolada actual.
  const points: Vector2D[] = ball
    .filter((k) => k.t <= currentTime)
    .map((k) => toPixels(board, k))
  points.push(toPixels(board, current))
  if (points.length < 2) return

  // Configuro el estilo de trazo simulando tiza: línea punteada, redondeada y translúcida.
  const lineWidth = Math.max(1.5, board.scale * 0.35)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = COLORS.trail
  ctx.lineWidth = lineWidth
  ctx.setLineDash([lineWidth * 2.2, lineWidth * 2.6])
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()
  ctx.restore()
}

/** Jugador esquemático: círculo con relleno suave y contorno de tiza. */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  board: Board,
  pos: Vector2D,
  color: string,
  highlighted: boolean,
  teamColor?: string,
): void {
  const p = toPixels(board, pos)
  const radius = board.scale * (highlighted ? 1.5 : 1.15)

  // Aquí decido el color de relleno: si hay color de equipo lo uso, y si no mantengo el color por defecto del rol.
  // El borde sigue siendo el color tiza del rol, así el goleador y el asistente se siguen distinguiendo.
  const fill = teamColor ?? color

  ctx.save()
  // Si es el goleador le pongo un halo para que destaque de lejos.
  if (highlighted) {
    ctx.globalAlpha = 0.25
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius * 1.9, 0, Math.PI * 2)
    ctx.fill()
  }
  // Con color de equipo subo la opacidad para que el tono se note, pero sin llegar a ser plano (se mezcla con la tiza).
  ctx.globalAlpha = highlighted ? 0.85 : teamColor ? 0.7 : 0.3
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, board.scale * (highlighted ? 0.4 : 0.3))
  ctx.stroke()
  ctx.restore()
}

/** Pelota actual: círculo claro con contorno; si la jugada está en marcha le agrego un anillo de movimiento. */
function drawBall(
  ctx: CanvasRenderingContext2D,
  board: Board,
  pos: Vector2D,
  isPlaying: boolean,
): void {
  const p = toPixels(board, pos)
  const radius = Math.max(3, board.scale * 0.85)

  ctx.save()
  if (isPlaying) {
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = COLORS.ball
    ctx.lineWidth = Math.max(1, board.scale * 0.2)
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = COLORS.ball
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.lineWidth = Math.max(1, board.scale * 0.2)
  ctx.beginPath()
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface LayerCache {
  key: string
  layer: HTMLCanvasElement
}

export default function ChalkboardCanvas({
  animationData,
  currentTime,
  isPlaying,
}: ChalkboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerCacheRef = useRef<LayerCache | null>(null)
  const [width, setWidth] = useState(0)

  const { pitch } = animationData
  const boardWidthM = pitch.width + BOARD_MARGIN * 2
  const boardHeightM = pitch.height + BOARD_MARGIN * 2

  // Observo el ancho del canvas para que sea responsive; el alto lo fija el aspect-ratio del CSS.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0].contentRect.width))
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Redibujo cada vez que cambia el tiempo, el tamaño o los datos.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssWidth = width
    const cssHeight = Math.round((width * boardHeightM) / boardWidthM)
    const dpr = window.devicePixelRatio || 1

    // Ajusto la resolución interna según el devicePixelRatio para que las líneas se vean nítidas.
    const pxW = Math.round(cssWidth * dpr)
    const pxH = Math.round(cssHeight * dpr)
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW
      canvas.height = pxH
    }

    const board = createBoard(cssWidth, pitch)

    // Reutilizo la capa estática mientras no cambie el tamaño, el dpr ni las medidas de la cancha.
    const key = `${cssWidth}x${cssHeight}@${dpr}:${pitch.width}x${pitch.height}`
    if (layerCacheRef.current?.key !== key) {
      layerCacheRef.current = {
        key,
        layer: renderStaticLayer(cssWidth, cssHeight, dpr, board),
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(layerCacheRef.current.layer, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Limito el tiempo al rango válido de la jugada.
    const t = Math.min(Math.max(currentTime, 0), animationData.duration)
    const { players, ball } = animationData

    // Primero la estela, para que jugadores y pelota queden por encima.
    const ballPos = interpolateTrack(ball, t)
    if (ballPos) drawBallTrail(ctx, board, ball, t, ballPos)

    // Jugadores secundarios, luego el asistente y por último el goleador (el más importante queda arriba).
    for (const other of players.others ?? []) {
      const pos = interpolateTrack(other.track, t)
      if (pos) drawPlayer(ctx, board, pos, COLORS.other, false, other.teamColor)
    }
    if (players.assister) {
      const pos = interpolateTrack(players.assister.track, t)
      if (pos) {
        drawPlayer(ctx, board, pos, COLORS.assister, false, players.assister.teamColor)
      }
    }
    const scorerPos = interpolateTrack(players.scorer.track, t)
    if (scorerPos) {
      drawPlayer(ctx, board, scorerPos, COLORS.scorer, true, players.scorer.teamColor)
    }

    // La pelota va al final para que siempre se vea.
    if (ballPos) drawBall(ctx, board, ballPos, isPlaying)
  }, [animationData, currentTime, isPlaying, width, pitch, boardWidthM, boardHeightM])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Pizarra táctica: ${animationData.title}`}
      className="block w-full rounded-xl shadow-lg"
      style={{ aspectRatio: `${boardWidthM} / ${boardHeightM}` }}
    />
  )
}
