import { HfInference } from "@huggingface/inference";

// @ts-ignore
const hf = new HfInference(import.meta.env.VITE_HF_TOKEN || "");
// @ts-ignore
const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY || "";

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

    // Phase 1: Google Cloud Vision API for objective visual extraction
    let visualExtraction = "No visual extraction available.";

    if (GOOGLE_VISION_API_KEY) {
      const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
      const visionRes = await fetch(visionApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Data },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'TEXT_DETECTION' }
            ]
          }]
        })
      });

      if (visionRes.ok) {
        const visionData = await visionRes.json();
        const annotationInfo = visionData.responses?.[0] || {};

        const labels = annotationInfo.labelAnnotations?.map((l: any) => l.description).join(", ") || "None";
        const objects = annotationInfo.localizedObjectAnnotations?.map((o: any) => o.name).join(", ") || "None";
        const textInfo = annotationInfo.fullTextAnnotation?.text?.replace(/\n/g, " ") || "None";

        visualExtraction = `Labels: ${labels}\nObjects Detected: ${objects}\nText Detected: ${textInfo}`;
      } else {
        console.warn("Google Vision API error", await visionRes.text());
      }
    } else {
      console.warn("No Google Vision API Key configured.");
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
      - If Similarity < 70%, set isValid to false and explain what is missing in the "reason" field.
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

    // Using a reliable instruction tuned model that returns good JSON on HF free tier
    const result = await hf.chatCompletion({
      model: "mistralai/Mistral-Nemo-Instruct-2407",
      messages: [
        { role: "system", content: "You are a helpful JSON-only output assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.1,
    });

    const reply = result.choices[0].message.content || "";

    // Clean up potential markdown formatting wrapping the JSON
    let cleanJson = reply.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    cleanJson = cleanJson.trim();

    let parsed: VerificationResult;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      // Fallback robust json extraction
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not extract JSON from HF response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Safety check for threshold
    if (parsed.similarity_score < 70) {
      parsed.isValid = false;
    }

    return parsed;
  } catch (error) {
    console.error("AI Verification failed:", error);
    return {
      isValid: true,
      reason: "Verification system timeout or configuration missing - proceeding with caution.",
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
