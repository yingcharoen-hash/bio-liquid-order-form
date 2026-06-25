# วิธีการนำ Web Application ขึ้นบน GitHub Pages

เมื่อคุณมีโค้ดอยู่ในโฟลเดอร์นี้แล้ว นี่คือขั้นตอนที่คุณจะนำเว็บขึ้นออนไลน์เพื่อให้ผู้ซื้อเข้ามาใช้งานได้ผ่านลิงก์ฟรีจาก GitHub (เช่น `https://username.github.io/bio-liquid-order-form/`)

### ขั้นตอนที่ 1: นำโค้ดขึ้น GitHub Repository
1. ไปที่ [GitHub.com](https://github.com/) สมัครสมาชิกและสร้าง Repository ใหม่ ตั้งชื่อเช่น `bio-liquid-order-form`
2. ในคอมพิวเตอร์ของคุณ เปิด Terminal/Command Prompt ชี้ไปที่โฟลเดอร์โปรเจกต์
3. รันคำสั่งต่อไปนี้ตามลำดับ:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ชื่อผู้ใช้ของคุณ/bio-liquid-order-form.git
git push -u origin main
```

### ขั้นตอนที่ 2: ตั้งค่า GitHub Pages 
เพื่อให้ GitHub สร้างหน้าเว็บจากโค้ดของเราแบบอัตโนมัติ เราจะใช้เครื่องมือที่มีชื่อว่า `gh-pages`

1. ในโฟลเดอร์โปรเจกต์ของคุณ ให้ติดตั้งแพ็กเกจ `gh-pages` โดยรันคำสั่ง:
```bash
npm install gh-pages --save-dev
```

2. เปิดไฟล์ `package.json` แล้วเพิ่มคำสั่งนี้เข้าไปในส่วน `"scripts"`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist",
  "dev": "vite",
  "build": "vite build",
  //...
}
```

3. **สำคัญ:** ตรวจสอบไฟล์ `vite.config.js` ในโฟลเดอร์โปรเจกต์ ว่ามีการใส่บรรทัด `base: './'` ไว้แล้ว (ซึ่งผมได้เตรียมไว้ให้แล้ว) 

4. รันคำสั่งเพื่อ Deploy:
```bash
npm run deploy
```

### ขั้นตอนที่ 3: ไปเอาลิงก์สำหรับใช้งาน
1. เข้าไปที่ Repository ของคุณบน GitHub (หน้าเว็บ)
2. ไปที่เมนู **Settings** (รูปเฟือง) ด้านบนขวาของ Repo
3. ที่เมนูด้านซ้าย เลื่อนลงมาหาคำว่า **Pages**
4. คุณจะเห็นลิงก์หน้าเว็บของคุณ (เช่น `Your site is live at https://...`)
5. นำลิงก์นั้นส่งให้ลูกค้าได้เลยครับ!

*ปล. อย่าลืมตั้งค่า Web App URL ของ Google Apps Script ในไฟล์ `src/App.jsx` ที่บรรทัด `const GAS_URL = ...` ให้เรียบร้อยและสั่ง `npm run deploy` ใหม่อีกครั้งนะครับ*
