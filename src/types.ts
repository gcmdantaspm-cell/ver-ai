export interface Cartao {
  id: string;
  pergunta: string;
  resposta: string;
  imagemPergunta?: string;
  imagemResposta?: string;
  origem?: string;
  acertos?: number;
  erros?: number;
  repetition?: number; // SM-2
  interval?: number; // SM-2 interval in days
  easeFactor?: number; // SM-2 ease factor
  nextReview?: string; // ISO 8601 string
}

export interface Subtopico {
  id: string;
  titulo: string;
  visto: boolean;
  data_estudo: string | null;
  revisoes_agendadas: string[]; // ISO 8601 strings
  revisoes_concluidas?: number;
  notas?: string;
  cartoes?: Cartao[];
  cartoes_erros?: Cartao[];
  acertos?: number;
  erros?: number;
}

export interface Topico {
  id: string;
  titulo: string;
  visto: boolean;
  data_estudo: string | null;
  revisoes_agendadas: string[]; // ISO 8601 strings
  revisoes_concluidas?: number;
  notas?: string;
  cartoes?: Cartao[];
  cartoes_erros?: Cartao[];
  acertos?: number;
  erros?: number;
  subtopicos: Subtopico[];
}

export interface Materia {
  id: string;
  nome: string;
  topicos: Topico[];
}

export interface AreaConhecimento {
  id: string;
  area: string;
  materias: Materia[];
}

export interface Edital {
  id: string;
  userId?: string;
  titulo: string;
  areas: AreaConhecimento[];
  isPublic?: boolean;
  ownerName?: string;
  importedFrom?: string;
  managedBy?: string;
  copiedByEmail?: string;
  copiedByName?: string;
  originalEditalId?: string;
}

export interface StudyCycleItem {
  id: string;
  materiaId: string;
  materiaNome: string;
  duracao: number; // minutes
  concluido: boolean;
}

export interface StudyCycle {
  id: string;
  editalId: string;
  userId?: string;
  nome: string;
  items: StudyCycleItem[];
  created_at: string;
  targetMinutes?: number;
  ordem?: number;
  isPublic?: boolean;
  ownerName?: string;
  managedBy?: string;
  copiedByEmail?: string;
  copiedByName?: string;
  originalCycleId?: string;
}

// Logic Models for Revision Queue
export interface RevisaoAgendada {
  editalId: string;
  editalTitulo: string;
  areaId: string;
  areaNome: string;
  materiaId: string;
  materiaNome: string;
  topicoOuSubId: string;
  tituloItem: string;
  dataRevisao: string;
  atrasada: boolean;
  diasAtraso: number;
}
