import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { getSchemaAsText } from "./schemaReader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Tool definition ที่ส่งให้ AI รู้จัก
const tools: Tool[] = [
  {
    functionDeclarations: [ // ประกาศ tool "query" ที่ AI จะใช้เรียกเพื่อดึงข้อมูลจาก database
      {
        name: "query",
        description: "Query the database using Prisma. Use this to retrieve data.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            model: {
              type: SchemaType.STRING,
              description: "The Prisma model name (e.g., User, Order)",
            },
            action: {
              type: SchemaType.STRING,
              description: "The Prisma action: findMany, findFirst, findUnique, count",
            },
            args: {
              type: SchemaType.OBJECT,
              description: "Prisma query arguments (where, select, orderBy, take, skip)",
              properties: {},
            },
          },
          required: ["model", "action"],
        },
      } as FunctionDeclaration,
    ],
  },
];

export async function askAI(userMessage: string): Promise<string> {
  const schemaText = getSchemaAsText();

  const systemInstruction = `
You are an AI assistant that helps users query a database.
You have access to the following database schema:

${schemaText}

Rules:
- Always use the "query" tool to retrieve data. Never answer from memory.
- Never write raw SQL.
- Only use the models and fields defined in the schema above.
- Keep responses concise and in the same language as the user's message.
`.trim();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction,
    tools,
  });

  const chat = model.startChat(); // เริ่ม chat session
  let response = await chat.sendMessage(userMessage); // ส่งข้อความจาก user ไปยัง AI และรอรับ response แรกกลับมา

  // Handle function call loop
  // ถ้า AI ตอบกลับมาพร้อมกับ function call
  // (เช่น ต้องการเรียก tool "query") เราจะทำการเรียก tool นั้นและส่งผลลัพธ์กลับไปให้ AI จนกว่า AI จะไม่ต้องการเรียก function อีกต่อไป
  while (response.response.functionCalls()?.length) {
    const calls = response.response.functionCalls()!; // ดึงข้อมูล function call ออกมา (จะมี name และ arguments ที่ AI ต้องการเรียก)
    const results = await Promise.all(
      calls.map(async (call) => {
        const { runQuery } = await import("../tools/queryTool");
        const args = call.args as Record<string, unknown>; // ดึง arguments ที่ AI ส่งมา (จะมี model, action, args)
        const result = await runQuery({ ...args, model: args.model, action: args.action });
        return {
          functionResponse: {
            name: call.name,
            response: { result },
          },
        };
      })
    );

    response = await chat.sendMessage(results); // ส่งผลลัพธ์ของ function call กลับไปให้ AI
  }

  return response.response.text();
}