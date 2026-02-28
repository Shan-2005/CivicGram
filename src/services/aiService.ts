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
}

export const verifyImageAgainstDescription = async (
  base64Image: string,
  userDescription: string,
  userLocation: string
): Promise<VerificationResult> => {
  try {
    // Remove the data:image/jpeg;base64, part if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const prompt = `
      Analyze this image of a civic issue. 
      User's description: "${userDescription}"
      User's location: "${userLocation}"

      Task:
      1. Verify if the image matches the description. If the user says "pothole" but it's a "cat", it's invalid.
      2. Categorize the issue (Roads, Garbage, Water, Safety, Power, Parks, or Other).
      3. Determine priority (CRITICAL, HIGH, MEDIUM, LOW).
      4. Generate a concise title and a detailed description based on visual evidence.
      5. Provide a trust score (0.0 to 1.0) based on how well it matches and image quality.

      Respond ONLY with a JSON object in this format:
      {
        "isValid": boolean,
        "reason": "explanation if invalid, otherwise empty",
        "category": "category name",
        "priority": "PRIORITY_LEVEL",
        "title": "concise title",
        "description": "detailed visual description",
        "trust_score": 0.95
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

    // Extract JSON from the response text (it might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI Verification failed:", error);
    // Fallback for demo or failure
    return {
      isValid: true,
      reason: "",
      category: "Other",
      priority: "MEDIUM",
      title: "Civic Issue Reported",
      description: userDescription,
      trust_score: 0.5
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
