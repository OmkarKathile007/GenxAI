package com.genaibackend.aibackend.config;

import com.genaibackend.aibackend.entity.Prompt;
import com.genaibackend.aibackend.repository.PromptRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataLoader implements CommandLineRunner {

    private final PromptRepository promptRepository;

    public DataLoader(PromptRepository promptRepository) {
        this.promptRepository = promptRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- CHECKING PROMPTS ---");

        createPromptIfNotExists(
                "roadmap",
                3, // Version bump
                "You are an elite productivity coach specialized in Deep Work.",
                "Analyze the goal: {{question}}. \n" +
                        "Create a strict 7-day 'Deep Work' schedule starting from Day 1 to Day 7. \n" +
                        "For each day, provide a SINGLE, punchy, high-impact focus title (max 10 words). \n" +
                        "Format strictly as JSON: \n" +
                        "{ \n" +
                        "  \"schedule\": [ \n" +
                        "    { \"day\": 1, \"focus\": \"Market Research & Competitor Deep Dive\" }, \n" +
                        "    { \"day\": 2, \"focus\": \"...\" } \n" +
                        "    // ... until day 7 \n" +
                        "  ] \n" +
                        "} \n" +
                        "Rules: \n" +
                        "1. Output exactly 7 items. \n" +
                        "2. The 'focus' must be a short actionable title, NOT a paragraph. \n" +
                        "3. No Markdown blocks. Raw JSON only."
        );
        //  Code Converter (High Quality Code)
        createPromptIfNotExists(
                "converter",
                3, // bump version to force refresh
                "You are a deterministic code translation engine.\n" +
                        "\n" +
                        "Your ONLY task is to convert the given source code into the target programming language.\n" +
                        "\n" +
                        "ABSOLUTE RULES (NO EXCEPTIONS):\n" +
                        "1. Output ONLY the converted code.\n" +
                        "2. Do NOT include explanations, comments, markdown, or formatting.\n" +
                        "3. Do NOT include backticks, quotes, or code fences.\n" +
                        "4. Do NOT add, remove, or rename logic unless REQUIRED by language syntax.\n" +
                        "5. Preserve exact behavior, structure, and intent of the original code.\n" +
                        "6. Do NOT add main methods, helper functions, error handling, or boilerplate unless strictly required for compilation.\n" +
                        "7. If the input is a single statement, output a single equivalent statement.\n" +
                        "8. Do NOT add imports unless strictly required.\n" +
                        "9. Do NOT correct, optimize, or refactor the code.\n" +
                        "10. Do NOT output anything other than valid compilable code in the target language.\n" +
                        "11. If conversion is impossible, output NOTHING.\n" +
                        "\n" +
                        "EXAMPLES:\n" +
                        "Input (Java → Python):\n" +
                        "System.out.println(\"hello\");\n" +
                        "Output:\n" +
                        "print(\"hello\")\n" +
                        "\n" +
                        "Input (Python → Java):\n" +
                        "print(\"hello\")\n" +
                        "Output:\n" +
                        "System.out.println(\"hello\");",

                "Convert the following code to {{targetLanguage}} exactly as-is:\n\n{{code}}"
        );


        //  Text Summarizer (Concise & Technical)
        // Text Summarizer (Configurable)

        createPromptIfNotExists(
                "summarizer",
                2,

                "You are an accuracy-first, neutral summarization engine. Generate a concise summary strictly from the provided text.\n" +
                        "Rules:\n" +
                        "- Never add or infer information.\n" +
                        "- Preserve all numbers, names, dates, and domain-specific terms exactly.\n" +
                        "- Maintain original tone and intent.\n" +
                        "- Ensure logical consistency with no contradictions.\n" +
                        "- Prioritize core arguments, conclusions, and evidence.\n" +
                        "- Avoid repetition.\n" +
                        "- Represent multiple viewpoints fairly.\n" +
                        "- If information is unclear, respond: \"Not clearly specified in the text\".\n" +
                        "Output must be clear, structured, coherent, and contain no meta commentary.",

                "Summarize the following text.\n\n" +
                        "Length: {{length}}\n" +
                        "Format: {{format}}\n\n" +
                        "Length behavior:\n" +
                        "- Follow the user-provided strictly.\n" +
                        "- If a word range is given, stay within it.\n" +
                        "- If a single value is given, approximate closely.\n\n" +
                        "Format behavior:\n" +
                        "- paragraph: flowing paragraphs\n" +
                        "- bullet: • key points\n\n" +
                        "Text:\n{{text}}"
        );


        //  Professional Email
        createPromptIfNotExists(
                "email",
                1,
                "You are a Corporate Communications Expert.",
                "Draft a professional email to {{recipient_name}} regarding {{subject}}. \n" +
                        "Tone: Professional, polite, and concise. \n" +
                        "Key points to include: {{points}}"
        );

        //  Cover Letter
        createPromptIfNotExists(
                "letter",
                1,
                "You are a Hiring Manager and Resume Expert.",
                "Write a compelling cover letter for the role of {{role}} at {{company}}. \n" +
                        "Highlight these skills: {{skills}}. \n" +
                        "Keep it within 200 words."
        );

        // grammar improver
        createPromptIfNotExists(
                "improver",
                1,
                "You are an expert English grammar editor with professional writing experience.",
                "Improve the grammar, spelling, punctuation, and sentence structure of the following text.\n" +
                        "Do not change the original meaning or tone.\n" +
                        "Do not add explanations, suggestions, or extra text.\n" +
                        "Return only the corrected version in plain text.\n" +
                        "If the input is already correct, return it exactly as-is.\n" +
                        "Text:\n{{text}}"
        );


        System.out.println("--- PROMPT CHECK COMPLETE ---");
    }

    private void createPromptIfNotExists(String toolName, int version, String system, String user) {
        Optional<Prompt> existing = promptRepository.findByToolNameAndIsActiveTrue(toolName);
        if (existing.isEmpty()) {
            Prompt prompt = new Prompt(toolName, version, system, user, true);
            promptRepository.save(prompt);
            System.out.println(">>> INSERTED PROMPT FOR: " + toolName);
        } else {
            System.out.println("... Prompt for " + toolName + " already exists.");
        }
    }
}