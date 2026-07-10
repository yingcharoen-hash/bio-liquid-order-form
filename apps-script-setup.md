# วิธีการอัปเดต Google Apps Script (ระยะที่ 2)

เพื่อให้ระบบสามารถรับไฟล์ภาพ "สลิปโอนเงิน" จากผู้ใช้ แล้วนำไปเซฟลง Google Drive ของคุณได้อย่างถูกต้อง คุณจำเป็นต้อง **คัดลอกโค้ดใหม่ด้านล่างนี้ ไปวางทับโค้ดเดิมทั้งหมด** ในหน้าต่าง Google Apps Script ของคุณครับ

### สิ่งที่ต้องทำ:
1. เปิดโปรเจกต์เดิมของคุณใน https://script.google.com/
2. นำโค้ดด้านล่างไปวางทับโค้ดเดิมทั้งหมด
3. ใส่ **SPREADSHEET_ID** เดิมของคุณกลับเข้าไป
4. **สำคัญมาก:** กด "ทำให้ใช้งานได้ (Deploy)" -> "การทำให้ใช้งานได้รายการใหม่ (New deployment)" อีกครั้ง (ห้ามกดอัปเดตเฉยๆ เพื่อให้ได้สิทธิ์เขียนไฟล์ลง Drive) 
5. ระบบอาจจะขอสิทธิ์เข้าถึง Google Drive ให้กดยอมรับสิทธิ์
6. **(ถ้า Web App URL เปลี่ยนไป ให้นำ URL ใหม่มาให้ผมด้วยนะครับ แต่ปกติถ้า Deploy ทับอันเดิม URL จะเป็นอันเดิม)**

```javascript
// 1. นำ ID ของ Google Sheet ของคุณมาใส่ตรงนี้เหมือนเดิม
const SPREADSHEET_ID = "1JJ66rsC8yfZ1Jw26C9FvpNmX4FAj0fOdgqbWax8BTWk";
const SHEET_NAME = "การตอบกลับแบบฟอร์ม 1"; // เปลี่ยนชื่อ Sheet ย่อยตามของคุณ

// 2. ID ของโฟลเดอร์เก็บสลิป (ที่คุณเพิ่งสร้าง)
const FOLDER_ID = "1bMoc_AI0ssP2FTUZWYHYwRPA_sb4Yu1v";

function doPost(e) {
  try {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "CORS OK" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    
    // --- ส่วนจัดการอัปโหลดภาพสลิป ---
    let slipUrl = "ไม่มีการแนบสลิป";
    if (data.slipBase64) {
      try {
        // ถอดรหัส Base64
        const decodedImage = Utilities.base64Decode(data.slipBase64);
        const blob = Utilities.newBlob(decodedImage, data.slipMimeType, "slip_" + new Date().getTime());
        
        // เซฟลงโฟลเดอร์
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const file = folder.createFile(blob);
        
        // ตั้งค่าให้ไฟล์แชร์แบบ ทุกคนที่มีลิงก์ดูได้
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        slipUrl = file.getUrl();
      } catch(imgErr) {
        slipUrl = "เกิดข้อผิดพลาดในการบันทึกสลิป: " + imgErr.toString();
      }
    }
    
    // เปิด Google Sheet เป้าหมาย
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // data.cartItems เป็น Array ของสินค้าที่สั่งซื้อ
    // วนลูปเพื่อบันทึกแต่ละรายการเป็น 1 แถว (Transaction)
    if (data.cartItems && data.cartItems.length > 0) {
      data.cartItems.forEach(item => {
        let mixStr = '';
        if (item.promoMix) {
          const mixes = [];
          for (let k in item.promoMix) { if(item.promoMix[k]>0) mixes.push(k+":"+item.promoMix[k]); }
          if (mixes.length>0) mixStr = " (" + mixes.join(", ") + ")";
        }
        const itemDetail = item.name + (item.hasScent && !item.isPromo ? " (กลิ่น" + item.selectedScent + ")" : "") + mixStr;
        
        const rowData = [
          data.orderDate || "",
          data.custCode || "",
          data.boothCode || "",
          data.shopName || "",
          data.name || "",
          data.phone || "",
          itemDetail,              // ชื่อสินค้าและกลิ่น (รวมโปรโมชั่นคละกลิ่น)
          item.quantity || 1,      // จำนวน
          item.price * item.quantity, // ราคารวมของรายการนี้
          slipUrl,                 // ลิงก์รูปสลิป
          new Date(),              // Timestamp
          item.earnedPoints || 0   // [คอลัมน์ใหม่] แต้มสะสมที่ได้จากรายการนี้
        ];
        sheet.appendRow(rowData);
      });
    } else {
      // กรณีไม่มีตะกร้า (เผื่อไว้)
      const rowData = [
        data.orderDate || "",
        data.custCode || "",
        data.boothCode || "",
        data.shopName || "",
        data.name || "",
        data.phone || "",
        data.orderSummary || "",  
        1,
        data.totalPrice || 0,     
        slipUrl,                  
        new Date(),
        data.earnedPoints || 0
      ];
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Saved successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}
```
