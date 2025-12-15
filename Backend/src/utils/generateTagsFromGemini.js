import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTagsFromGemini = async (title, description) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Generate 3-6 relevant tags (as comma-separated keywords) based on the title and description below.
    Title: ${title}
    Description: ${description}
    Only return the comma-separated tags, no extra text.
    `;

    try {
        const result = await model.generateContent([prompt]); 
        const response = await result.response;
        const text = response.text().trim();

        const tags = text
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);
        return tags;
    } catch (error) {
        console.error("Gemini tag generation failed:", error.message);
        return []; 
    }
};
