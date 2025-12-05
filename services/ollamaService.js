// import axios from "axios";

// export const generateText = async (prompt) => {
//   try {
//     const response = await axios.post("http://localhost:11434/api/generate", {
//       model: "llama3",
//       prompt,
//       stream: false,
//     });

//     return response.data.response;
//   } catch (err) {
//     console.error("Ollama error:", err.message);
//     return null;
//   }
// };

import axios from "axios";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

export const generateText = async (prompt) => {
  try {
    const { data } = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: process.env.OLLAMA_MODEL || "llama3",
        prompt,
        stream: false,
      },
      {
        // in case you deploy behind docker / proxy and need timeout tweaks
        timeout: 30000,
      }
    );

    if (!data || typeof data.response !== "string") {
      console.error("Ollama invalid/empty response:", data);
      return null;
    }

    return data.response;
  } catch (err) {
    console.error(
      "Ollama error:",
      err?.response?.data || err.message || err.toString()
    );
    return null; // VERY IMPORTANT: never throw – caller must handle null
  }
};
