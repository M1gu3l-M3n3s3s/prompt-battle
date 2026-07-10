export interface Player {
  id: string;
  username: string;
  socketId: string;
  isHost: boolean;
  score: number;
  streak: number;
  eliminated: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  phase: GamePhase;
  round: number;
  maxRounds: number;
  currentTheme: string;
  prompts: PromptSubmission[];
  images: ImageSubmission[];
  votes: Vote[];
  roundOrder: string[];
  timerEndsAt: number | null;
}

export type GamePhase =
  | 'waiting'
  | 'prompt_writing'
  | 'generating'
  | 'voting'
  | 'reveal'
  | 'finished';

export interface PromptSubmission {
  playerId: string;
  prompt: string;
}

export interface ImageSubmission {
  playerId: string;
  imageUrl: string;
  prompt: string;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export const THEMES = [
  'Un gato samurái en Neo-Tokyo',
  'Un dragón helado custodiando un castillo de cristal',
  'Una biblioteca infinita en el espacio',
  'Un robot jardinero cuidando un jardín de estrellas',
  'Una ciudad submarina con arquitectura bioluminescente',
  'Un chef fantasma preparando la cena en un castillo encantado',
  'Un tren a vapor viajando a través de un bosque de caramelos',
  'Una bailarina de ballet en un planeta de gravedad cero',
  'Un detective privado en un mundo de dinosaurios',
  'Una tienda de mascotas mágicas en una esquina de Brooklyn',
  'Un caballero medieval con armadura de LED',
  'Una selva donde las plantas son de cristal',
  'Un mercadillo flotante en las nubes',
  'Una banda de rock compuesta enteramente por pulpos',
  'Un faro que conecta dimensiones paralelas',
  'Una carrera de autos en una pista de gelatina',
  'Un artista callejero pintando con luz de estrellas',
  'Un té virtual en un campo de flores digitales',
  'Un pulpo que toca el piano en un bar de jazz',
  'Una expedición a un volcán de chocolate',
  'Un bosque donde los árboles cantan al atardecer',
  'Un circo ambulante en el desierto con caravanas steampunk',
  'Una batalla de rap entre inteligencias artificiales',
  'Un jardín zen con arena de oro líquido',
  'Una nave espacial hecha de madera reciclada',
];

export const PROMPT_TIME = 30;
export const GENERATING_TIME = 60;
export const VOTING_TIME = 30;
export const REVEAL_TIME = 10;
