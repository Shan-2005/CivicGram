import { HfInference } from "@huggingface/inference";

// @ts-ignore
const hf = new HfInference(import.meta.env.VITE_HF_TOKEN || "");

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
    // Phase 1: Hugging Face Image Captioning (Free Tier)
    let visualExtraction = "No visual extraction available.";

    try {
      // Convert base64 data URL to Blob for HF API
      const res = await fetch(base64Image);
      const blob = await res.blob();

      // Attempt image captioning with retry for cold-start models
      let captionRes;
      try {
        captionRes = await hf.imageToText({
          model: "Salesforce/blip-image-captioning-large",
          data: blob,
        });
      } catch (err: any) {
        if (err.message?.includes("loading")) {
          console.log("BLIP model is loading, retrying in 5 seconds...");
          await new Promise((r) => setTimeout(r, 5000));
          captionRes = await hf.imageToText({
            model: "Salesforce/blip-image-captioning-large",
            data: blob,
          });
        } else {
          throw err;
        }
      }

      visualExtraction = `Visual Description: ${captionRes.generated_text}`;
      console.log("HF Phase 1 Extraction:", visualExtraction);
    } catch (captionErr: any) {
      console.warn("Hugging Face Image Captioning error:", captionErr);
      visualExtraction = `ERROR during visual extraction: ${captionErr.message || "Unknown error"}. Please use the user description as the primary truth if it sounds plausible for a city environment.`;
    }

    // Phase 2: Hugging Face NLP for Logic & JSON synthesis
    const prompt = `
You are a Civic Inspection AI.
Follow this logic to verify the user's report based on the provided Visual Evidence.

VISUAL EVIDENCE (Extracted automatically):
${visualExtraction}

CONTEXT:
- User's Description: "${userDescription}"
- User's Location: "${userLocation}"
- User's Suggested Category: "${suggestedCategory}"

TASK:
- Compare the VISUAL EVIDENCE with the User's inputs.
- Calculate a Similarity Score (0-100%): How closely does the visual evidence support the user's claim?
- IMPORTANT: If the Visual Description mentions objects or scenes related to the user's claim (e.g. "trash", "garbage", "pile", "street", "dirt", "broken", "water", "damage"), give a HIGH similarity score (75+).
- IMPORTANT: If VISUAL EVIDENCE contains an ERROR message, trust the user's description if it sounds plausible for a city environment and set similarity_score to 65 and trust_score to 0.4.
- If Similarity < 50%, set isValid to false and explain what is missing in the "reason" field.
- Set Category: Choose the most accurate from (Roads, Garbage, Water, Safety, Power, Parks, or Other).
- Set Priority: CRITICAL, HIGH, MEDIUM, LOW.

YOU MUST RESPOND ONLY IN VALID RAW JSON FORMAT, EXACTLY MATCHING THIS STRUCTURE. DO NOT ADD MARKDOWN OR EXTRA TEXT:
{
  "isValid": boolean,
  "reason": "Clear explanation of match/mismatch",
  "category": "Category name",
  "priority": "PRIORITY_LEVEL",
  "title": "Concise, professional title",
  "description": "Professional summary of the verified issue",
  "trust_score": 0.0-1.0,
  "similarity_score": 0-100,
  "visual_evidence": "List of key visual features identified from the VISUAL EVIDENCE"
}
`;

    const result = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: "You are a helpful JSON-only output assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.1,
    });

    const reply = result.choices[0].message.content || "";

    // Clean up potential markdown formatting wrapping the JSON
    let cleanJson = reply.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    cleanJson = cleanJson.trim();

    let parsed: VerificationResult;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not extract JSON from HF response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Safety check for threshold
    if (parsed.similarity_score < 50) {
      parsed.isValid = false;
    }

    return parsed;
  } catch (error: any) {
    console.error("AI Verification failed:", error);
    alert(`AI Verification Error: ${error?.message || JSON.stringify(error)}`);
    return {
      isValid: true,
      reason: `Verification system error: ${error?.message} - proceeding with caution.`,
      category: "Other",
      priority: "MEDIUM",
      title: "Manual Verification Required",
      description: userDescription,
      trust_score: 0.5,
      similarity_score: 50,
      visual_evidence: "Unverified due to system error",
    };
  }
};

export const analyzeIssueImage = async (base64Image: string) => {
  const result = await verifyImageAgainstDescription(base64Image, "General civic issue", "Unknown location");
  return {
    category: result.category,
    priority: result.priority,
    is_fake: !result.isValid,
    trust_score: result.trust_score,
    title: result.title,
    description: result.description,
  };
};
