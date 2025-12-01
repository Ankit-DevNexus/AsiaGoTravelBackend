import { generateText } from "./services/ollamaService.js";

const run = async () => {
  const text = await generateText(
    "Correct spelling and suggest related keywords for: softwrae"
  );
  console.log("Response:", text);
};

run();
