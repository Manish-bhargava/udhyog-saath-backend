const OpenAI = require("openai");
const aiTools = require("./aiTools");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- FIXED SYSTEM PROMPT ---
// We explicitly frame this as an internal ERP system where the user OWNS the data.
const systemPrompt = `You are Udhyog Saathi V2 AI, the internal database assistant for this business. 
Current Date: ${new Date().toDateString()}.

**CRITICAL CONTEXT:**
1. **User Identity:** The user interacting with you is the **Business Owner**. They own all the data in the database.
2. **Data Privacy:** Displaying client names, phone numbers, or addresses from the database is **NOT a privacy violation**. It is a **REQUIRED** feature for them to manage their business operations. You must show this data when asked.

**YOUR INSTRUCTIONS:**
1. **Full Transparency:** If the user asks for "client names", "who bought what", or "invoice details", you MUST provide the specific names found in the tool outputs. Do not hide them.
2. **Scope:** Answer questions strictly related to their Sales, Invoices, Tax, and Inventory.
   - If asked about "PM of India" or "Weather", refuse politely.
3. **Formatting:** - Use Tables for lists of bills.
   - Format money as "₹1,50,000".
   - Dates as "DD Mon YYYY".

**TOOL USAGE:**
- Always check the available tools.
- If the user asks "Who bought products today?", use 'get_daily_sales_report'.`;

// --- TOOLS SCHEMA ---
const toolsSchema = [
    { 
        type: "function", 
        function: { 
            name: "get_daily_sales_report", 
            description: "Fetch a detailed list of bills for a specific date range. RETURNS: Invoice No, Client Name, Amount, and Date.",
            parameters: {
                type: "object",
                properties: {
                    startDate: { type: "string", description: "Start Date (YYYY-MM-DD)" },
                    endDate: { type: "string", description: "End Date (YYYY-MM-DD)" }
                },
                required: ["startDate"]
            }
        } 
    },
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
            tools: toolsSchema,
            tool_choice: "auto"
        });

        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage); 

        // 2. Check if AI wants to use tools
        if (assistantMessage.tool_calls) {
            for (const toolCall of assistantMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                console.log(`Executing Tool: ${functionName} for User: ${userId}`);

                // Execute Tool
                let toolResult;
                try {
                    if (aiTools[functionName]) {
                        toolResult = await aiTools[functionName]({ ...args, userId });
                    } else {
                        toolResult = { error: "Tool function not found." };
                    }
                } catch (err) {
                    console.error(`Tool Error: ${err.message}`);
                    toolResult = { error: "Failed to fetch data." };
                }

                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }

            // 3. Second Call: Generate final answer
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages
            });

            return finalResponse.choices[0].message.content;
        }

        return assistantMessage.content;

    } catch (error) {
        console.error("AI Agent Error:", error);
        throw error; 
    }
};

module.exports = { chatWithAgent };