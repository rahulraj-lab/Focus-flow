
import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem, RecurringRule, DayPerformance } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PriorityItem {
  text: string;
  level: 'High' | 'Medium' | 'Low';
}

export interface ScheduleOption {
  title: string;
  description: string;
  items: Partial<ScheduleItem>[];
}

export interface OptimizationInsight {
  title: string;
  observation: string;
  suggestion: string;
  impact: 'High' | 'Medium' | 'Low';
  type: 'efficiency' | 'wellbeing' | 'pattern';
}

export interface OptimizationResponse {
  options: ScheduleOption[];
  insights: OptimizationInsight[];
}

export const generateScheduleOptions = async (
  prompt: string, 
  priorities: PriorityItem[] = [],
  history?: Record<string, DayPerformance>,
  recurringRules?: RecurringRule[]
): Promise<OptimizationResponse> => {
  const priorityString = priorities.length > 0 
    ? `\n\nSTRATEGIC PRIORITIES:\n${priorities.map(p => `- ${p.text} (Priority: ${p.level})`).join('\n')}\n`
    : '';

  const historyContext = history && Object.keys(history).length > 0
    ? `\n\nUSER PERFORMANCE HISTORY (Last few entries):\n${Object.values(history).slice(-7).map(h => `- ${h.date}: ${h.percentage}% completion (${h.completedTasks}/${h.totalTasks} tasks done)`).join('\n')}`
    : '';

  const rulesContext = recurringRules && recurringRules.length > 0
    ? `\n\nCURRENT RECURRING RULES:\n${recurringRules.map(r => `- ${r.hour}:00: ${r.task} (${r.type})`).join('\n')}`
    : '';

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an elite productivity coach and behavioral scientist. Analyze the user's request and historical data to provide 3 optimized schedule variations and specific "Routine Insights".
               
               USER REQUEST: "${prompt}"
               ${priorityString}
               ${historyContext}
               ${rulesContext}
               
               TASK:
               1. Generate THREE unique schedule options (Productivity, Balanced, High-Performance).
               2. CRITICAL: Analyze the historical data. If completion is low, identify why. If recurring tasks are clashing with peak productivity, suggest moves.
               3. Provide 3-4 "Optimization Insights" that highlight patterns in the user's habits and suggest specific changes to recurring rules.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hour: { type: Type.INTEGER },
                      task: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ["hour", "task", "notes"]
                  }
                }
              },
              required: ["title", "description", "items"]
            }
          },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                observation: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                impact: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["title", "observation", "suggestion", "impact", "type"]
            }
          }
        },
        required: ["options", "insights"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return { options: [], insights: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return { options: [], insights: [] };
  }
};
