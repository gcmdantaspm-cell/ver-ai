export interface Subtopico {
  id: string;
  titulo: string;
  visto: boolean;
  data_estudo: string | null;
  revisoes_agendadas: string[]; // ISO 8601 strings
  revisoes_concluidas?: number;
  notas?: string;
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
  titulo: string;
  areas: AreaConhecimento[];
  isPublic?: boolean;
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
