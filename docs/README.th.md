# E-commerce Recommender MVP ฉบับภาษาไทย

เอกสารนี้อธิบายภาพรวมของโปรเจกต์ วิธีรันระบบ วิธีทดสอบ MVP เดิม และ use case ใหม่ของหน้าเว็บร้านกาแฟ

## ตัวเลือกภาษา

- English: [README.md](d:\RepositoryVS\Codex\README.md)
- ไทย: [docs/README.th.md](d:\RepositoryVS\Codex\docs\README.th.md)

## โปรเจกต์นี้มีอะไรบ้าง

- ล็อกอินแบบ mock ด้วย `user_id` จาก dataset
- ระบบแนะนำสินค้าแบบเฉพาะบุคคล
- ระบบประเมินผล recommendation ด้วย hidden future purchases
- dashboard สำหรับเปรียบเทียบ recommender models
- หน้า scenario เพิ่มเติมสำหรับร้านกาแฟที่ route `/coffee`

## โครงสร้างระบบ

- `frontend/`: Next.js web app
- `backend/`: FastAPI service

## หน้าที่มีในระบบ

- `http://localhost:3000/`: หน้า E-commerce Recommender MVP
- `http://localhost:3000/coffee`: หน้า Coffee Recommendation Web App

## วิธีรันระบบ

### รัน Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### รัน Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:3000` และ backend จะรันที่ `http://localhost:8000`

## แนวคิดของ MVP เดิม

แนวคิดหลักของระบบ e-commerce เดิมคือ

1. ผู้ใช้ล็อกอินด้วย `user_id` ที่อยู่ใน dataset ได้โดยตรง
2. ระบบแนะนำสินค้าให้ตามพฤติกรรมของ user คนนั้น
3. ระบบประเมินผล recommendation โดยเทียบกับข้อมูลการซื้อในอนาคตที่ถูกซ่อนไว้
4. เราเปรียบเทียบหลายโมเดลได้ในหน้าเว็บเดียว

## สถานะปัจจุบัน

ตอนนี้ระบบมี 2 scenario หลัก

### 1. E-commerce MVP

- ใช้ dataset สินค้าทั่วไป
- มี recommendation และ evaluation flow ครบ
- มี modal สำหรับดูรายละเอียดเพิ่มเติม

### 2. Coffee Recommendation Web App

- ใช้ dataset ร้านกาแฟแยกจากของเดิม
- แนะนำเครื่องดื่ม อาหาร เบเกอรี่ และของทานเล่น
- แสดงความสัมพันธ์ของพฤติกรรมผู้ใช้ เช่น
  - favorite drink
  - favorite food pairing
  - preferred time of day
  - common pairings
  - recent order items

ข้อจำกัดปัจจุบัน

- ยังใช้ dataset ตัวอย่างแบบ CSV
- authentication ยังเป็น mock login
- evaluation ยังเป็น offline evaluation
- ยังไม่ได้เชื่อม PostgreSQL จริง

## Coffee Scenario คืออะไร

หน้า `/coffee` เป็น web app ปกติ ไม่ใช่ mobile mockup แล้ว

เป้าหมายของหน้านี้คือให้เห็นความสัมพันธ์จากข้อมูลร้านกาแฟ เช่น

- user คนนี้ชอบดื่มกาแฟอะไร
- user คนนี้มักซื้ออาหารอะไรคู่กับเครื่องดื่ม
- user มักซื้อช่วงเวลาไหนของวัน
- recommendation ที่ระบบแนะนำมีโอกาสตรงกับ order ในอนาคตหรือไม่

ไฟล์ dataset ของร้านกาแฟ:

- [coffee_users.csv](d:\RepositoryVS\Codex\backend\data\coffee_users.csv)
- [coffee_products.csv](d:\RepositoryVS\Codex\backend\data\coffee_products.csv)
- [coffee_interactions.csv](d:\RepositoryVS\Codex\backend\data\coffee_interactions.csv)

endpoint ที่เกี่ยวข้อง:

- `GET /coffee/users`
- `POST /coffee/auth/mock-login`
- `GET /coffee/users/{user_id}/recommendations?model=item_cooccurrence&k=6`
- `GET /coffee/users/{user_id}/evaluation?model=item_cooccurrence&k=6`
- `GET /coffee/users/{user_id}/insights`
- `GET /coffee/dashboard/summary`

## ขั้นตอนทดสอบหลัก

### การทดสอบที่ 1: ตรวจสอบ backend

สิ่งที่ทำ:

- เปิด `http://localhost:8000/health`

ผลที่คาดหวัง:

- ได้ `{"status":"ok"}`

### การทดสอบที่ 2: ตรวจสอบหน้า e-commerce เดิม

สิ่งที่ทำ:

- เปิด `http://localhost:3000/`
- เลือก user จาก dataset
- ดู recommendation และ evaluation

ผลที่คาดหวัง:

- ระบบล็อกอิน mock ได้
- recommendation เปลี่ยนตาม user
- มีค่า precision, recall, hit rate

### การทดสอบที่ 3: ตรวจสอบหน้า coffee web app

สิ่งที่ทำ:

- เปิด `http://localhost:3000/coffee`
- เลือก user เช่น `C100`
- ดู recommendation cards
- กดเปิด modal ของ behavior insights

ผลที่คาดหวัง:

- หน้าแสดงผลเป็น web app ปกติ
- user ล็อกอินด้วย coffee dataset ได้
- recommendation แสดงทั้งกาแฟ อาหาร และของทานเล่น
- เห็นข้อมูลเชิง insight เช่น favorite drink, favorite food, preferred daypart, pairings

### การทดสอบที่ 4: ตรวจสอบ API ฝั่ง coffee โดยตรง

สิ่งที่ทำ:

- เรียก endpoint `/coffee/...` โดยตรง

ผลที่คาดหวัง:

- ได้ JSON ถูกต้อง
- recommendation และ insights สอดคล้องกับ dataset

## สิ่งที่ตรวจสอบแล้วใน workspace นี้

- backend health endpoint ตอบกลับสำเร็จ
- e-commerce mock login สำหรับ `U100` ทำงาน
- e-commerce recommendations และ evaluation ทำงาน
- coffee users endpoint ตอบกลับสำเร็จ
- coffee recommendations, evaluation, และ insights สำหรับ `C100` ทำงาน
- frontend build ผ่านและมี route `/coffee`

## ขั้นตอนถัดไปที่แนะนำ

1. เปลี่ยนจาก dataset ตัวอย่างไปเป็น dataset จริง
2. เพิ่มโมเดลที่แรงขึ้น เช่น ALS หรือ LightFM
3. เพิ่ม automated tests
4. เพิ่ม experiment tracking
5. เพิ่ม navigation ใน frontend เพื่อสลับระหว่าง e-commerce และ coffee scenario ให้ชัดเจนขึ้น
