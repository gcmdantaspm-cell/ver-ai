import { GoogleGenAI, Type } from "@google/genai";
import { AreaConhecimento, Materia, Topico, Subtopico } from "../types";
import { v4 as uuidv4 } from "uuid";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : "");
const ai = new GoogleGenAI({ apiKey });

export async function parseEditalText(text: string): Promise<AreaConhecimento[]> {
  try {
    const configOptions = {
      contents: `You are a Senior Software Architect and Study Mentor.
Extract the following text from a Public Exam Syllabus (Edital) into a structured JSON array.
Follow the hierarchy: Area de Conhecimento -> Materias -> Topicos -> Subtopicos.
Only output Area de Conhecimento at the top level of the array.

CRITICAL INSTRUCTION FOR NESTED TERMS:
If the text contains highly nested items (e.g., 4.1, 4.1.1, Título I, Capítulo II) that go deeper than the standard 4 levels, you MUST flatten them into the "subtopicos" array of their parent "topico". 
Make sure NO nested checkboxes or bullet points are lost. Treat everything below a "Topico" as a "Subtopico", even if it has multiple levels of indentation (just include the title text as a subtopic string).

Example structure:
[
  {
    "area": "CONHECIMENTOS GERAIS",
    "materias": [
      {
        "nome": "4. NOÇÕES DE DIREITO",
        "topicos": [
          {
            "titulo": "4.1 Constituição da República Federativa do Brasil",
            "subtopicos": [
              { "titulo": "Título I: Dos Princípios Fundamentais" },
              { "titulo": "Título II: Dos Direitos e Garantias Fundamentais" },
              { "titulo": "Capítulo I: Dos Direitos e Deveres Individuais e Coletivos" }
            ]
          }
        ]
      }
    ]
  }
]

Text to parse:
${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              area: { type: Type.STRING },
              materias: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: { type: Type.STRING },
                    topicos: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          titulo: { type: Type.STRING },
                          subtopicos: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                titulo: { type: Type.STRING }
                              },
                              required: ["titulo"]
                            }
                          }
                        },
                        required: ["titulo", "subtopicos"]
                      }
                    }
                  },
                  required: ["nome", "topicos"]
                }
              }
            },
            required: ["area", "materias"]
          }
        }
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-3.1-pro-preview"
      });
    } catch (err: any) {
      if (err?.status === 503 || err?.status === 429 || err?.message?.match(/high demand|429|503/i)) {
        console.log("gemini-3.1-pro-preview failed, falling back to gemini-3-flash-preview");
        response = await ai.models.generateContent({
          ...configOptions,
          model: "gemini-3-flash-preview"
        });
      } else {
        throw err;
      }
    }

    const parsed = JSON.parse(response.text || "[]");
    
    // Add IDs, default values
    return parsed.map((area: any): AreaConhecimento => ({
      id: uuidv4(),
      area: area.area,
      materias: area.materias.map((materia: any): Materia => ({
        id: uuidv4(),
        nome: materia.nome,
        topicos: materia.topicos.map((topico: any): Topico => ({
          id: uuidv4(),
          titulo: topico.titulo,
          visto: false,
          data_estudo: null,
          revisoes_agendadas: [],
          subtopicos: (topico.subtopicos || []).map((sub: any): Subtopico => ({
            id: uuidv4(),
            titulo: sub.titulo,
            visto: false,
            data_estudo: null,
            revisoes_agendadas: []
          }))
        }))
      }))
    }));
  } catch (error) {
    console.error("Failed to parse edital with Gemini", error);
    throw error;
  }
}

export interface StudyCycleParams {
  weeklyHours: number;
  cycleHours: number;
  numCycles: number;
  subjectsInfo: {
    nome: string;
    questoes: number;
    peso: number;
  }[];
}

export async function generateStudyCycleAI(editalTitle: string, materias: string[], params?: StudyCycleParams): Promise<any[]> {
  try {
    let extraContext = "";
    if (params) {
      const totalMinutesAllCycles = params.numCycles * params.cycleHours * 60;
      
      extraContext = `
Additional Context for calculation:
- Time available per week: ${params.weeklyHours} hours.
- Target AVERAGE cycle time: ${params.cycleHours} hours.
- The user requested exactly ${params.numCycles} separate cycles to be generated.
- TOTAL TIME ACROSS ALL CYCLES: ${totalMinutesAllCycles} minutes.

Based on the number of questions and weights provided, here is the EXACT total amount of minutes each subject MUST be studied across ALL ${params.numCycles} cycles combined.
${(function() {
  const sortedSubjects = [...params.subjectsInfo]
    .map(s => ({ ...s, points: s.questoes * s.peso }))
    .sort((a, b) => b.points - a.points);
  
  const totalPoints = sortedSubjects.reduce((acc, s) => acc + s.points, 0);
  
  let grandTotal = 0;
  const results = sortedSubjects.map(s => {
    const proportion = totalPoints > 0 ? s.points / totalPoints : 0;
    let subjectMinutes = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
    
    // Round to nearest 5 minutes
    subjectMinutes = Math.max(30, Math.round(subjectMinutes / 5) * 5);
    
    grandTotal += subjectMinutes;
    return `  * "${s.nome}": ${subjectMinutes} minutes total.`;
  }).join("\n");
  
  return `${results}\n\n-> GRAND TOTAL REQUIRED ACROSS ALL BLOCKS AND CYCLES: ${grandTotal} minutes.`;
})()}

CRITICAL INSTRUCTIONS FOR DISTRIBUTION (FOLLOW EXACTLY):
1. MANDATORY INCLUSION: You MUST include EVERY SINGLE SUBJECT listed above in the output. Do not omit ANY of them!
2. CHUNKING: The MINIMUM 'duracao' for a single block is 30. The MAXIMUM 'duracao' is 90.
3. SPLITTING AND DISTRIBUTING: You MUST distribute these chunks across exactly ${params.numCycles} distinct cycles.
4. EXACT MATCH: The sum of the 'duracao' fields for a specific subject across ALL cycles MUST EXACTLY match the required minutes above.
5. BALANCED CYCLES: Try to keep each cycle roughly around ${params.cycleHours * 60} minutes, but it doesn't need to be exact if the chunks don't allow it perfectly.
`;
    }

    const configOptions = {
      contents: `You are a Study Mentor specializing in High-Performance Preparation for Public Exams.
Design Study Cycles (Ciclos de Estudos) for the exam: "${editalTitle}".
List of subjects available: ${materias.join(", ")}.
${extraContext}

Guidelines:
1. Return exactly ${params ? params.numCycles : 1} cycle(s).
2. Assign a suggested duration for each subject session (in MINUTES).
3. Each cycle should be balanced, alternating between high-concentration subjects and more mechanical/fast ones.

Return a JSON array of cycles, each cycle containing its name and array of items:

Example:
[
  {
    "nome": "Ciclo 1",
    "items": [
      { "materiaNome": "Direito Constitucional", "duracao": 90 },
      { "materiaNome": "Língua Portuguesa", "duracao": 60 }
    ]
  },
  {
    "nome": "Ciclo 2",
    "items": [
      { "materiaNome": "Direito Administrativo", "duracao": 90 }
    ]
  }
]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    materiaNome: { type: Type.STRING },
                    duracao: { type: Type.NUMBER }
                  },
                  required: ["materiaNome", "duracao"]
                }
              }
            },
            required: ["nome", "items"]
          }
        }
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-3.1-pro-preview"
      });
    } catch (err: any) {
      console.warn("Fallback to gemini-3-flash-preview due to:", err);
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-3-flash-preview"
      });
    }

    if (!response.text) {
      throw new Error(`Empty response from Gemini API.`);
    }

    try {
      return JSON.parse(response.text);
    } catch (parseError) {
      console.error("Failed to parse JSON:", response.text);
      throw new Error(`Invalid JSON format returned by AI.`);
    }
  } catch (error: any) {
    console.error("Failed to generate cycle with Gemini", error);
    throw new Error(error.message || "Failed to generate cycle");
  }
}

export async function generateStudyNotes(materiaNome: string, topicoTitulo: string, subtopicoTitulo?: string): Promise<string> {
  try {
    const configOptions = {
      contents: `You are an Expert Study Mentor and Content Creator for Public Exams.
Your task is to generate highly structured, optimized study notes for the following subject and topic:

Subject (Matéria): ${materiaNome}
Topic (Tópico): ${topicoTitulo}
${subtopicoTitulo ? `Subtopic (Subtópico): ${subtopicoTitulo}` : ""}

CRITICAL INSTRUCTIONS:
1. Format the output in Markdown.
2. Structure the content beautifully using Tables, Bullet Points, and Bold Text for emphasis.
3. DYNAMIC CLASSIFICATION: You MUST adapt your structure based on the NATURE of the subject.
   - If the subject is ENGLISH (Inglês): You MUST break down typical texts or vocabulary into grammatical structures:
     * Verbs (Action and State) - List them in a table (English | Base | Translation).
     * Nouns (Names and Subjects) - Table with contextual tips.
     * Conjunctions and Prepositions (Text logic) - Table with logic/function.
     * Pronouns (References).
     * Adjectives and Adverbs.
     * Expressions and Phrasal Verbs.
   - If the subject is LAW/LEGAL (Direito): Break it down into Concepts, Main Articles, Key Keywords, Jurisprudence, and Exceptions. Table format preferred.
   - If the subject is IT/TECH (Tecnologia/Informática): Break down into Component/Concept, Definition, Use Case, and Practical Example.
4. Keep the content directly helpful for exam review (mnemonics, mental triggers, key summaries).
5. The language MUST be in Brazilian Portuguese (PT-BR) except for English vocabulary examples.`,
      config: {
        responseMimeType: "text/plain",
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-3.1-pro-preview"
      });
    } catch (err: any) {
      if (err?.status === 503 || err?.status === 429 || err?.message?.match(/high demand|429|503/i)) {
        console.log("gemini-3.1-pro-preview failed, falling back to gemini-3-flash-preview");
        response = await ai.models.generateContent({
          ...configOptions,
          model: "gemini-3-flash-preview"
        });
      } else {
        throw err;
      }
    }

    return response.text || "";
  } catch (error) {
    console.error("Failed to generate study notes", error);
    throw new Error("Failed to generate study notes");
  }
}
