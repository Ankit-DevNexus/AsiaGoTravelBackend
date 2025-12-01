import axios from "axios";

export const generateText = async (prompt) => {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt,
      stream: false,
    });

    return response.data.response;
  } catch (err) {
    console.error("Ollama error:", err.message);
    return null;
  }
};
