import type { GoalData } from '../types/game'

// Aquí concentro todos los goles del juego; para agregar uno nuevo basta con sumarlo a este array.
export const goalsList: GoalData[] = [
  // Gol 1: el gol de ejemplo (ficticio) que usaba la demo.
  {
    animation: {
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
      hints: { year: 2019, month: 'Marzo', minute: 67 },
    },
    questions: {
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
    },
  },

  // Gol 2: Maradona a Inglaterra, México 1986. Las posiciones y tiempos son una estimación aproximada de la jugada real.
  {
    animation: {
      id: 'maradona-inglaterra-1986',
      title: 'Maradona a Inglaterra (1986)',
      duration: 11,
      pitch: { width: 105, height: 68 },
      ball: [
        { t: 0, x: 0.4, y: 0.75 },
        { t: 1.5, x: 0.5, y: 0.7 },
        { t: 3, x: 0.62, y: 0.62 },
        { t: 4.5, x: 0.72, y: 0.55 },
        { t: 6, x: 0.8, y: 0.52 },
        { t: 7.5, x: 0.87, y: 0.47 },
        { t: 9, x: 0.93, y: 0.5 },
        { t: 10, x: 0.97, y: 0.52 },
        { t: 11, x: 1, y: 0.5 },
      ],
      players: {
        scorer: {
          teamColor: '#75aadb',
          track: [
            { t: 0, x: 0.38, y: 0.77 },
            { t: 1.5, x: 0.49, y: 0.71 },
            { t: 3, x: 0.61, y: 0.63 },
            { t: 4.5, x: 0.71, y: 0.56 },
            { t: 6, x: 0.79, y: 0.53 },
            { t: 7.5, x: 0.86, y: 0.48 },
            { t: 9, x: 0.92, y: 0.5 },
            { t: 11, x: 0.99, y: 0.5 },
          ],
        },
        assister: {
          teamColor: '#75aadb',
          track: [
            { t: 0, x: 0.34, y: 0.8 },
            { t: 4, x: 0.5, y: 0.75 },
            { t: 11, x: 0.65, y: 0.7 },
          ],
        },
        others: [
          {
            id: 'reid',
            teamColor: '#f5f5f5',
            track: [
              { t: 0, x: 0.45, y: 0.68 },
              { t: 2.5, x: 0.55, y: 0.66 },
              { t: 5, x: 0.6, y: 0.7 },
              { t: 11, x: 0.6, y: 0.72 },
            ],
          },
          {
            id: 'butcher',
            teamColor: '#f5f5f5',
            track: [
              { t: 0, x: 0.62, y: 0.45 },
              { t: 6, x: 0.82, y: 0.5 },
              { t: 8, x: 0.92, y: 0.6 },
              { t: 11, x: 0.94, y: 0.62 },
            ],
          },
          {
            id: 'fenwick',
            teamColor: '#f5f5f5',
            track: [
              { t: 0, x: 0.7, y: 0.6 },
              { t: 6.5, x: 0.85, y: 0.55 },
              { t: 8.5, x: 0.9, y: 0.4 },
              { t: 11, x: 0.92, y: 0.38 },
            ],
          },
          {
            id: 'shilton',
            teamColor: '#2a9d4a',
            track: [
              { t: 0, x: 0.97, y: 0.5 },
              { t: 8, x: 0.96, y: 0.5 },
              { t: 10, x: 0.985, y: 0.42 },
              { t: 11, x: 0.99, y: 0.4 },
            ],
          },
        ],
      },
      hints: { year: 1986, month: 'Junio', minute: 55 },
    },
    questions: {
      player: {
        id: 'q1',
        prompt: '¿Quién lo hizo?',
        options: ['Diego Maradona', 'Jorge Valdano', 'Claudio Caniggia', 'Jorge Burruchaga'],
        correctIndex: 0,
      },
      opponent: {
        id: 'q2',
        prompt: '¿A quién se lo hizo?',
        options: ['Alemania Occidental', 'Bélgica', 'Inglaterra', 'Italia'],
        correctIndex: 2,
      },
      tournament: {
        id: 'q3',
        prompt: '¿En qué torneo?',
        options: ['Copa América 1987', 'Mundial de México 1986', 'Mundial de Italia 1990', 'Mundial de España 1982'],
        correctIndex: 1,
      },
    },
  },
]
