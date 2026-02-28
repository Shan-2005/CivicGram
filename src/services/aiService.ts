import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface VerificationResult {
  isValid: boolean;
  reason: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  trust_score: number;
  similarity_score: number;
  visual_evidence: string;
}

export const verifyImageAgainstDescription = async (
  base64Image: string,
  userDescription: string,
  userLocation: string,
  suggestedCategory: string = ""
): Promise<VerificationResult> => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const prompt = `
      You are a Civic Inspection AI. Follow this two-step process to verify the user's report.

      CONTEXT:
      - User's Description: "${userDescription}"
      - User's Location: "${userLocation}"
      - User's Suggested Category: "${suggestedCategory}"

      STEP 1: OBJECTIVE VISUAL EXTRACTION
      - Describe EXACTLY what is visible in the provided image.
      - Be clinical and detailed. Avoid assuming it's a "civic issue" unless clearly visible.
      - Focus on: Objects, Textures, Damage, Lighting, and Background context.

      STEP 2: SEMANTIC COMPARISON & LOGIC
      - Compare your "Objective Visual Extraction" with the User's inputs.
      - Calculate a Similarity Score (0-100%): How closely does the visual evidence support the claim?
      - If Similarity < 70%, set isValid to false and explain what is missing.
      - Final Categorization: Choose the most accurate from (Roads, Garbage, Water, Safety, Power, Parks, or Other). Use the "Suggested Category" as a strong hint if it fits.
      - Set Priority: CRITICAL, HIGH, MEDIUM, LOW.

      Response Format (JSON ONLY):
      {
        "isValid": boolean,
        "reason": "Clear explanation of match/mismatch",
        "category": "Category name",
        "priority": "PRIORITY_LEVEL",
        "title": "Concise, professional title",
        "description": "Professional summary of the verified issue",
        "trust_score": 0.0-1.0 (based on image quality and evidence consistency),
        "similarity_score": 0-100,
        "visual_evidence": "List of key visual features identified"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const parsed: VerificationResult = JSON.parse(jsonMatch[0]);

    // Safety check for threshold
    if (parsed.similarity_score < 70) {
      parsed.isValid = false;
    }

    return parsed;
  } catch (error) {
    console.error("AI Verification failed:", error);
    return {
      isValid: true,
      reason: "Verification system timeout - proceeding with caution.",
      category: "Other",
      priority: "MEDIUM",
      title: "Manual Verification Required",
      description: userDescription,
      trust_score: 0.5,
      similarity_score: 50,
      visual_evidence: "Unverified due to system error"
    };
  }
};

// Keeping the original function for backward compatibility if needed, 
// but it will now use the same logic if possible.
export const analyzeIssueImage = async (base64Image: string) => {
  const result = await verifyImageAgainstDescription(base64Image, "General civic issue", "Unknown location");
  return {
    category: result.category,
    priority: result.priority,
    is_fake: !result.isValid,
    trust_score: result.trust_score,
    title: result.title,
    description: result.description
  };
};
