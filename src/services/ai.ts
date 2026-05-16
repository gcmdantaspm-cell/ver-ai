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
        model: "gemini-2.5-flash"
      });
    } catch (err: any) {
      if (err?.status === 503 || err?.status === 429 || err?.message?.match(/high demand|429|503/i)) {
        console.log("gemini-2.5-flash failed, falling back to gemini-1.5-pro");
        try {
          response = await ai.models.generateContent({
            ...configOptions,
            model: "gemini-1.5-pro"
          });
        } catch(fallbackErr: any) {
           console.log("gemini-1.5-pro failed, falling back to gemini-1.5-flash");
           response = await ai.models.generateContent({
             ...configOptions,
             model: "gemini-1.5-flash"
           });
        }
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
  totalHoursPerCycle: number;
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
      extraContext = `
Additional Context for calculation:
- Total hours suggested for ONE FULL CYCLE: ${params.totalHoursPerCycle} hours.
- Subject Details (Questions and Weights):
${params.subjectsInfo.map(s => `  * ${s.nome}: ${s.questoes} questions, Weight: ${s.peso}`).join("\n")}

IMPORTANT CALCULATION RULE:
Use the formula (Questions * Weight) to determine the relative importance of each subject. 
Distribute the ${params.totalHoursPerCycle} hours proportionally among the subjects based on their importance, while maintaining a balanced cycle.
If a subject is much more important, it can appear twice in the cycle or have a longer duration (max 120min per block).
`;
    }

    const configOptions = {
      contents: `You are a Study Mentor specializing in High-Performance Preparation for Public Exams.
Design a Study Cycle (Ciclo de Estudos) for the exam: "${editalTitle}".
List of subjects available: ${materias.join(", ")}.
${extraContext}

Guidelines:
1. Organize subjects into a logical sequence (cycle).
2. Assign a suggested duration for each subject session (in MINUTES).
3. The cycle should be balanced, alternating between high-concentration subjects and more mechanical/fast ones.
4. Suggest a realistic time block for each (typically 60 to 120 minutes).
5. If the total hours per cycle was provided, ensure the sum of durations matches approximately that total.

Return a JSON array of items, each with:
- materiaNome: Name of the subject (must be one from the list provided).
- duracao: Duration in minutes.

Example:
[
  { "materiaNome": "Direito Constitucional", "duracao": 90 },
  { "materiaNome": "Língua Portuguesa", "duracao": 60 }
]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-2.0-flash"
      });
    } catch (err: any) {
      response = await ai.models.generateContent({
        ...configOptions,
        model: "gemini-1.5-flash"
      });
    }

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to generate cycle with Gemini", error);
    throw error;
  }
}
