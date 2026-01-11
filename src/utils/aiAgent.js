const OpenAI = require("openai");
const aiTools = require("./aiTools");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are Udhyog Saathi V2 AI, a Virtual CFO for Indian Wholesalers. 
Current Date: Monday, January 12, 2026.
Rules: 
1. Use tools to get real data. 
2. Never show PII like buyer names/addresses.
3. If data is missing, tell the user politely.`;

const toolsSchema = [
    { type: "function", function: { name: "get_total_revenue", description: "Get total lifetime revenue." } },
    { type: "function", function: { name: "get_monthly_comparison", description: "Compare sales between months." } },
    { type: "function", function: { name: "get_tax_summary", description: "Get total GST collected." } },
    { type: "function", function: { name: "get_top_products", description: "Identify top 5 selling products." } }
];

const chatWithAgent = async (userId, userMessage) => {
    try {
        // 1. First Call: Ask AI what tools it needs
        let messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            tools: toolsSchema
        });

        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage); // Add assistant's tool request to history

        // 2. Check if AI wants to use tools
        if (assistantMessage.tool_calls) {
            // LOOP through EVERY tool call requested
            for (const toolCall of assistantMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                console.log(`Executing Tool: ${functionName} for User: ${userId}`);

                // Execute the specific tool
                const toolResult = await aiTools[functionName]({ ...args, userId });

                // Add the result to the messages array with the CORRECT tool_call_id
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }

            // 3. Second Call: Give all tool results back to AI for the final answer
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages
            });

            return finalResponse.choices[0].message.content;
        }

        return assistantMessage.content;

    } catch (error) {
        console.error("AI Agent Error:", error);
        throw error; // Let controller handle the 500
    }
};

module.exports = { chatWithAgent };