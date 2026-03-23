# Week 11 Project

โปรเจกต์นี้เป็นเซิร์ฟเวอร์ Express ที่ใช้ Prisma สำหรับจัดการฐานข้อมูล PostgreSQL และ Google Generative AI สำหรับการสนทนา AI ที่สามารถเรียกใช้เครื่องมือ (tools) เพื่อ query ข้อมูลจากฐานข้อมูล

## โครงสร้างโปรเจกต์

- `src/index.ts`: เซิร์ฟเวอร์หลักที่ตั้งค่า Express และ routing
- `src/chatRouter.ts`: จัดการ endpoint `/chat` สำหรับการสนทนากับ AI
- `src/mcpRouter.ts`: จัดการ endpoint `/mcp` สำหรับรับ tool calls จาก AI
- `src/lib/llm.ts`: จัดการการเรียกใช้ Google Generative AI และกำหนด tools
- `src/lib/schemaReader.ts`: อ่าน schema ของ Prisma และแปลงเป็นข้อความสำหรับ AI
- `src/tools/queryTool.ts`: เรียกใช้ Prisma queries ตาม input จาก AI
- `prisma/schema.prisma`: กำหนดโมเดลฐานข้อมูล (User, Order)
- `prisma/seed.ts`: ข้อมูลเริ่มต้นสำหรับฐานข้อมูล
- `prisma/migrations/`: ไฟล์ migration สำหรับฐานข้อมูล

## การติดตั้งและตั้งค่า

1. ติดตั้ง dependencies:
   ```
   npm install
   ```

2. ตั้งค่า environment variables ในไฟล์ `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   GEMINI_API_KEY="your_gemini_api_key"
   PORT=8080
   ```

3. รัน Prisma migration:
   ```
   npx prisma migrate deploy
   ```

4. Seed ข้อมูลเริ่มต้น:
   ```
   npx ts-node prisma/seed.ts
   ```

## การรันโปรเจกต์

```
npm run dev
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:8080`

## API Endpoints

### POST /chat
ส่งข้อความไปยัง AI และรับคำตอบ

**Request Body:**
```json
{
  "message": "แสดงรายชื่อผู้ใช้ทั้งหมด"
}
```

**Response:**
```json
{
  "success": true,
  "reply": "คำตอบจาก AI"
}
```

ทำงานอย่างไร: รับข้อความจากผู้ใช้ ส่งไปยัง Google Generative AI พร้อม schema ของฐานข้อมูล AI จะใช้ tool "query" เพื่อเรียกข้อมูลจากฐานข้อมูลผ่าน `/mcp` endpoint

### POST /mcp
รับ tool calls จาก AI และ execute ในฐานข้อมูล

**Request Body:**
```json
{
  "tool": "query",
  "input": {
    "model": "User",
    "action": "findMany",
    "args": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": [...]
}
```

ทำงานอย่างไร: ตรวจสอบ tool และ input เรียก `runQuery` ใน `queryTool.ts` เพื่อ execute Prisma query ในฐานข้อมูล

## วิธีการทำงานของแต่ละส่วน

### src/index.ts
- ตั้งค่า Express app
- ใช้ CORS และ JSON parsing
- Mount routers สำหรับ `/mcp` และ `/chat`
- รันเซิร์ฟเวอร์ที่ port ที่กำหนด

### src/chatRouter.ts
- จัดการ POST /chat
- ตรวจสอบ input message
- เรียก `askAI` จาก `llm.ts` เพื่อได้คำตอบ
- ส่ง response กลับ

### src/mcpRouter.ts
- จัดการ POST /mcp
- ตรวจสอบ tool และ input
- เรียก `runQuery` สำหรับ tool "query"
- ส่งผลลัพธ์หรือ error กลับ

### src/lib/llm.ts
- สร้าง instance ของ GoogleGenerativeAI
- กำหนด tool "query" สำหรับ AI ใช้เรียกฐานข้อมูล
- ฟังก์ชัน `askAI`: ส่งข้อความและ schema ไปยัง AI รับคำตอบ

### src/lib/schemaReader.ts
- อ่านไฟล์ `prisma/schema.prisma`
- แยกโมเดลและฟิลด์ออกมา
- แปลงเป็นข้อความสำหรับ AI อ่าน

### src/tools/queryTool.ts
- ตรวจสอบและ validate input ด้วย Zod
- สร้าง Prisma client กับ PostgreSQL adapter
- เรียก Prisma methods ตาม model และ action ที่กำหนด
- คืนผลลัพธ์ของ query

### Prisma Schema
- **User**: มีฟิลด์ id, email, name, createAt และ relation กับ Order
- **Order**: มีฟิลด์ id, item, quantity, userId, createAt และ relation กับ User

## ตัวอย่างการใช้งาน

1. ส่งข้อความ "แสดงผู้ใช้ทั้งหมด" ไปที่ `/chat`
2. AI จะเรียก tool "query" ผ่าน `/mcp`
3. `queryTool` จะรัน `prisma.user.findMany()`
4. ผลลัพธ์ส่งกลับไปยัง AI
5. AI สรุปและส่งคำตอบกลับผู้ใช้</content>
<parameter name="filePath">c:\Users\nutda\CE385\week11\README.md