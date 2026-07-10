import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const OpenAIProvider = {
  name: "OpenAI",

  async generateCompletion(systemPrompt, userPrompt, jsonMode = false) {
    if (!openai) {
      throw new Error("OpenAI API key is missing or not configured.");
    }

    try {
      const options = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      };

      if (jsonMode) {
        options.response_format = { type: "json_object" };
      }

      // Execute request with a 15-second timeout safeguard
      const responsePromise = openai.chat.completions.create(options);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI completion request timed out")), 15000)
      );

      const completion = await Promise.race([responsePromise, timeoutPromise]);
      const content = completion.choices[0].message.content;

      if (jsonMode) {
        try {
          return JSON.parse(content);
        } catch (e) {
          console.error("OpenAI response parsing failed. Raw response:", content);
          throw new Error("Invalid JSON returned from AI provider");
        }
      }

      return content;
    } catch (error) {
      console.error("OpenAIProvider request failed:", error.message);
      throw error;
    }
  },
};
