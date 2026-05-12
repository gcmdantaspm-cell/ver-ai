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
