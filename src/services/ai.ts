import { GoogleGenAI, Type } from "@google/genai";
import { AreaConhecimento, Materia, Topico, Subtopico } from "../types";
import { v4 as uuidv4 } from "uuid";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : "");
const ai = new GoogleGenAI({ apiKey });

export async function parseEditalText(text: string): Promise<AreaConhecimento[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are a Senior Software Architect and Study Mentor.
Extract the following text from a Public Exam Syllabus (Edital) into a structured JSON array.
Follow the hierarchy: Area de Conhecimento -> Materias -> Topicos -> Subtopicos.
Only output Area de Conhecimento at the top level of the array.

Example structure:
[
  {
    "area": "CONHECIMENTOS GERAIS",
    "materias": [
      {
        "nome": "LÍNGUA PORTUGUESA",
        "topicos": [
          {
            "titulo": "1 Compreensão e interpretação de textos",
            "subtopicos": [
              {
                "titulo": "1.1 Elementos de referenciação"
              }
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
    });

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
