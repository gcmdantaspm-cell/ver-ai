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
  totalHoursPerCycle: number;
  subjectsInfo: {
    nome: string;
    questoes: number;
    peso: number;
  }[];
  maxSubjectsPerCycle?: number;
}

export async function generateStudyCycleAI(editalTitle: string, materias: string[], params?: StudyCycleParams): Promise<any[]> {
  try {
    let extraContext = "";
    if (params) {
      extraContext = `
Additional Context for calculation:
- Target cycle time: ${params.totalHoursPerCycle} hours (${params.totalHoursPerCycle * 60} minutes).
${params.maxSubjectsPerCycle && params.maxSubjectsPerCycle > 0 ? `- The user requested a maximum of ${params.maxSubjectsPerCycle} subjects in this cycle. The least important subjects have been pruned.` : ""}

Based on the number of questions and weights provided, here is the EXACT total amount of minutes each subject MUST be studied. (Note: minimum 30 mins per subject is enforced)
${(function() {
  const sortedSubjects = [...params.subjectsInfo]
    .map(s => ({ ...s, points: s.questoes * s.peso }))
    .sort((a, b) => b.points - a.points);
  
  const selectedSubjects = params.maxSubjectsPerCycle && params.maxSubjectsPerCycle > 0 
    ? sortedSubjects.slice(0, params.maxSubjectsPerCycle) 
    : sortedSubjects;

  const totalPoints = selectedSubjects.reduce((acc, s) => acc + s.points, 0);
  const totalMinutes = params.totalHoursPerCycle * 60;
  
  let grandTotal = 0;
  const results = selectedSubjects.map(s => {
    const proportion = totalPoints > 0 ? s.points / totalPoints : 0;
    let subjectMinutes = Math.max(30, Math.round(proportion * totalMinutes));
    
    // Round to nearest 5 minutes
    subjectMinutes = Math.max(30, Math.round(subjectMinutes / 5) * 5);
    
    grandTotal += subjectMinutes;
    return `  * "${s.nome}": ${subjectMinutes} minutes total.`;
  }).join("\n");
  
  return `${results}\n\n-> GRAND TOTAL REQUIRED ACROSS ALL BLOCKS: ${grandTotal} minutes.`;
})()}

CRITICAL INSTRUCTIONS FOR DISTRIBUTION (FOLLOW EXACTLY):
1. MANDATORY INCLUSION: You MUST include EVERY SINGLE SUBJECT listed above in the cycle. Do not omit ANY of them!
2. CHUNKING: The MINIMUM 'duracao' for a single block is 30. The MAXIMUM 'duracao' is 90.
3. SPLITTING: If a subject has a total time greater than 90 minutes, you MUST provide MULTIPLE JSON objects (blocks) for that subject, split into chunks between 30 and 90 minutes. Scatter these chunks throughout the array to avoid having them back-to-back.
4. EXACT MATCH: The sum of the 'duracao' fields for a specific subject MUST EXACTLY match the required minutes above.
5. NO EXTRAS: DO NOT include any subjects that are NOT in the list above.
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
