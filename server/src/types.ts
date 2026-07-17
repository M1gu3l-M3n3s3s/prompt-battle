export interface Player {
  id: string;
  username: string;
  socketId: string;
  isHost: boolean;
  score: number;
  streak: number;
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
  'Un templo griego flotando entre las nubes',
  'Una sirena pintando un mural en el fondo del océano',
  'Un faraón egipcio jugando ajedrez con esfinges',
  'Una bruja preparando un caldo en una cueva de cristal',
  'Unos vikingos navegando en un barco hecho de huesos de ballena',
  'Una ciudad maya oculta dentro de una cascada',
  'Un león con corona de flores gobernando una selva brillante',
  'Una procesión de esqueletos tocando mariachis en el desierto',
  'Unos samuráis luchando bajo una lluvia de pétalos de cerezo',
  'Unos gladiadores romanos luchando en una arena de arena dorada',
  'Unos duendes construyendo una ciudad subterránea de gemas',
  'Unos esquimales cazando una aurora boreal viviente',
  'Unos piratas navegando en un barco fantasma por un río de lava',
  'Unos ninjas luchando en un techo bajo la luz de la luna',
  'Unos vaqueros cazando un bisonte mecánico en el Lejano Oeste',
  'Unos magos mezclando pociones en una torre de arena',
  'Unos exploradores descubriendo una ciudad perdida en la selva',
  'Unos guerreros espartanos luchando contra una horda de zombis',
  'Unos monjes budistas meditando en la cima de una montaña flotante',
  'Unos gladiadores luchando en una arena submarina',
  'Unos esquimales construyendo un iglú de diamantes',
  'Unos vaqueros del desierto persiguiendo bandidos en motocicletas',
  'Unos monjes tocando campanas en un templo de bambú',
  'Unos exploradores del Ártico descubriendo un castillo de hielo',
  'Una rana gigante gobernando un reino de nenúfares',
  'Unos elfos construyendo una ciudad en las copas de los árboles',
  'Unos centauros compitiendo en una carrera de caballos',
  'Unos minotauros jugando ajedrez en un laberinto de mármol',
  'Unos fénix renaciendo de las cenizas en un bosque encantado',
  'Unos trolls construyendo un puente sobre un río de lava',
  'Unos gnomos excavando en una mina de gemas brillantes',
  'Unos hadas tejiendo telarañas de luz en un bosque nocturno',
  'Unos ogros cocinando un festín en una cueva de montaña',
  'Unos ogros cuidando un jardín de setas gigantes',
  'Unos enanos forjando una espada legendaria en un volcán',
];

export const PROMPT_TIME = 30;
export const GENERATING_TIME = 60;
export const VOTING_TIME = 30;
export const REVEAL_TIME = 10;
