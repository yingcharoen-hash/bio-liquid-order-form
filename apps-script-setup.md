# วิธีการตั้งค่า Google Apps Script (Standalone)

เนื่องจากลิงก์ `https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml` ที่คุณเตรียมไว้เป็นลิงก์ "แผ่นที่เผยแพร่บนเว็บ (Published to web)" ซึ่งจะใช้ "เขียน" ข้อมูลลงไปตรงๆ ไม่ได้ 
ดังนั้น เราต้องใช้ **Google Apps Script** เป็นตัวกลางรับข้อมูลจากแบบฟอร์มบนเว็บ แล้วนำข้อมูลนั้นไปเขียนลงในไฟล์ Google Sheet ต้นฉบับครับ

### ขั้นตอนการสร้าง Standalone Script:
1. ไปที่เว็บไซต์ https://script.google.com/
2. กดปุ่ม **"โครงการใหม่" (New Project)** ที่มุมซ้ายบน
3. คัดลอกโค้ดด้านล่างนี้ ไปวางทับโค้ดเดิมทั้งหมดในหน้าต่าง 편집기 (Editor)
4. **สำคัญมาก:** คุณต้องเปลี่ยนค่า `SPREADSHEET_ID` ในโค้ด ให้เป็น ID ของ Google Sheet ต้นฉบับของคุณ (แผ่นงานที่แอดมินใช้) 
   *(วิธีหา ID: เปิด Google Sheet นั้นขึ้นมา ดูที่ช่อง URL จะมีรหัสยาวๆ อยู่ระหว่าง `d/` และ `/edit` เช่น `1ABCDEFG...` นำรหัสนั้นมาใส่)*

```javascript
// นำ ID ของ Google Sheet ของคุณมาใส่ตรงนี้ (ไม่ใช่ลิงก์ 2PACX... นะครับ)
const SPREADSHEET_ID = "ใส่_SPREADSHEET_ID_ตรงนี้";
const SHEET_NAME = "Sheet1"; // เปลี่ยนชื่อ Sheet ย่อย (Tab) ตามของคุณ (เช่น การตอบกลับแบบฟอร์ม 1)

function doPost(e) {
  try {
    // กำหนด header เพื่อรองรับ CORS (ให้หน้าเว็บ React โทรข้ามโดเมนได้)
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // กรณีเป็น Options Request (Preflight)
    if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "CORS OK" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // แปลงข้อมูลที่ส่งมาจาก React ให้เป็น JSON
    const data = JSON.parse(e.postData.contents);
    
    // เปิด Google Sheet เป้าหมาย
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // เตรียมข้อมูลเป็นแถวใหม่เรียงตามคอลัมน์ (ปรับลำดับตามหัวคอลัมน์ใน Sheet คุณ)
    // ลำดับ: วันที่, รหัสลูกค้า, รหัสร้าน, ชื่อร้าน, ชื่อลูกค้า, เบอร์โทร, จำนวนน้ำยา
    const rowData = [
      data.orderDate || "",
      data.custCode || "",
      data.boothCode || "",
      data.shopName || "",
      data.name || "",
      data.phone || "",
      data.quantity || 1,
      new Date() // Timestamp
    ];
    
    // บันทึกข้อมูลลงแถวใหม่ล่างสุด
    sheet.appendRow(rowData);
    
    // ตอบกลับไปหา React ว่าสำเร็จ
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Saved successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // เกิดข้อผิดพลาด
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// รองรับ Options (CORS preflight)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}
```

### วิธีทำให้เว็บเรียกใช้งานโค้ดนี้ได้ (Deploy)
1. เมื่อวางโค้ดและเปลี่ยน ID เสร็จแล้ว ให้กดปุ่ม **"ทำให้ใช้งานได้" (Deploy)** ที่มุมขวาบน
2. เลือก **"การทำให้ใช้งานได้รายการใหม่" (New deployment)**
3. กดรูปเฟืองทางซ้าย เลือก **"เว็บแอป" (Web app)**
4. ตั้งค่าดังนี้:
   - สิทธิ์การเข้าถึง (Execute as): `ฉัน (Me)`
   - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): `ทุกคน (Anyone)`
5. กด **"ทำให้ใช้งานได้"** (ระบบอาจให้กดยืนยันตัวตนและให้สิทธิ์เข้าถึง Sheet)
6. คัดลอก **URL ของเว็บแอป** (Web app URL) ที่ลงท้ายด้วย `/exec` มาให้ผมได้เลยครับ! เราจะนำ URL นี้ไปใส่ในโค้ดฝั่งเว็บไซต์ครับ
