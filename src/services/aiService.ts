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

/**
 * Extracts basic visual features from an image using the Canvas API.
 * This runs entirely in the browser, no external API needed.
 */
async function extractVisualFeatures(base64Image: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 64; // Small dimensions for fast analysis
        const scale = Math.min(maxDim / img.width, maxDim / img.height);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Calculate dominant colors
        const colorBuckets: Record<string, number> = {};
        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 64) * 64;
          const g = Math.round(pixels[i + 1] / 64) * 64;
          const b = Math.round(pixels[i + 2] / 64) * 64;
          const key = `rgb(${r},${g},${b})`;
          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        const sortedColors = Object.entries(colorBuckets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([color, count]) => {
            const pct = Math.round((count / (pixels.length / 4)) * 100);
            return `${color} (${pct}%)`;
          });

        // Calculate brightness
        let totalBrightness = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        }
        const avgBrightness = Math.round(totalBrightness / (pixels.length / 4));
        const brightnessLabel =
          avgBrightness < 64 ? "very dark" :
            avgBrightness < 128 ? "dark/dim" :
              avgBrightness < 192 ? "moderate" : "bright";

        // Determine color characteristics
        let greenPixels = 0, bluePixels = 0, brownPixels = 0, grayPixels = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (g > r * 1.2 && g > b * 1.2) greenPixels++;
          if (b > r * 1.2 && b > g * 1.2) bluePixels++;
          if (r > 100 && g > 60 && g < r && b < g) brownPixels++;
          if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) grayPixels++;
        }
        const totalPixels = pixels.length / 4;
        const colorProfile = [];
        if (greenPixels / totalPixels > 0.15) colorProfile.push("contains significant green (vegetation/parks possible)");
        if (bluePixels / totalPixels > 0.15) colorProfile.push("contains significant blue (sky/water possible)");
        if (brownPixels / totalPixels > 0.15) colorProfile.push("contains significant brown (dirt/debris/earth possible)");
        if (grayPixels / totalPixels > 0.4) colorProfile.push("mostly gray tones (concrete/asphalt/urban environment likely)");

        const features = [
          `Image dimensions: ${img.width}x${img.height}`,
          `Brightness: ${brightnessLabel} (avg: ${avgBrightness}/255)`,
          `Dominant colors: ${sortedColors.join(", ")}`,
          colorProfile.length > 0 ? `Color analysis: ${colorProfile.join("; ")}` : "Color analysis: mixed/varied colors",
          "Note: This is a basic pixel analysis. The image content cannot be fully determined from colors alone."
        ];

        resolve(features.join("\n"));
      } catch (err) {
        resolve("Could not analyze image pixels.");
      }
    };
    img.onerror = () => resolve("Could not load image for analysis.");
    img.src = base64Image;
  });
}

export const verifyImageAgainstDescription = async (
  base64Image: string,
  userDescription: string,
  userLocation: string,
  suggestedCategory: string = ""
): Promise<VerificationResult> => {
  try {
    // Phase 1: Browser-based pixel analysis (no external API needed)
    const pixelAnalysis = await extractVisualFeatures(base64Image);
    console.log("Phase 1 - Pixel Analysis:\n", pixelAnalysis);

    // Phase 2: Hugging Face NLP for verification & JSON synthesis
    const prompt = `
You are a Civic Issue Verification AI for a city reporting app called CivicGram.

A user has submitted a photo with a description. You have basic pixel analysis of the photo (colors, brightness) but NOT a full visual description. Your job is to evaluate whether the user's claim is plausible.

PIXEL ANALYSIS OF THE PHOTO:
${pixelAnalysis}

USER'S REPORT:
- Description: "${userDescription}"
- Location: "${userLocation}"
- Suggested Category: "${suggestedCategory}"

VERIFICATION RULES:
1. Since we only have pixel analysis (not full image recognition), use the color/brightness data as supporting evidence.
2. If the pixel analysis shows characteristics consistent with the user's claim (e.g., gray tones for road issues, brown/mixed for garbage, green for parks), give a moderate-to-high similarity score (60-80).
3. If the pixel analysis clearly contradicts the claim (e.g., user says "flooding" but image is very bright with no blue), give a low score.
4. For ambiguous cases where pixel data doesn't clearly confirm or deny, give a score of 55-65 and set isValid to true with a note about limited verification.
5. If the description is clearly nonsensical or impossible, set isValid to false regardless of pixel data.
6. Always provide a reasonable category, title, and description regardless of validity.

RESPOND ONLY IN VALID RAW JSON (no markdown, no extra text):
{
  "isValid": true/false,
  "reason": "Explanation of verification result",
  "category": "Roads/Garbage/Water/Safety/Power/Parks/Other",
  "priority": "CRITICAL/HIGH/MEDIUM/LOW",
  "title": "Professional issue title",
  "description": "Professional summary of the reported issue",
  "trust_score": 0.0-1.0,
  "similarity_score": 0-100,
  "visual_evidence": "Summary of pixel analysis findings relevant to the claim"
}`;

    const result = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: "You are a JSON-only output assistant for civic issue verification." },
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
      if (!jsonMatch) throw new Error("Could not extract JSON from AI response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Hard threshold: under 50% = definitely invalid
    if (parsed.similarity_score < 50) {
      parsed.isValid = false;
    }

    return parsed;
  } catch (error: any) {
    console.error("AI Verification failed:", error);
    // When verification completely fails, REJECT the post (don't let fake reports through)
    return {
      isValid: false,
      reason: `Verification system error: ${error?.message}. Please try again later.`,
      category: suggestedCategory || "Other",
      priority: "MEDIUM",
      title: "Verification Unavailable",
      description: userDescription,
      trust_score: 0,
      similarity_score: 0,
      visual_evidence: "Verification could not be completed due to a system error.",
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
