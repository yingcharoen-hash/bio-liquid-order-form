import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import './index.css';

// URLs
const USERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOeBTcG5H5NUM24qhWDyxIl9yVqL2ql3lcHHJIzUbHcA7n_Ry5R9JTOfOXiXWiFrME0X2a7M5bqvX8/pub?gid=584278207&single=true&output=csv';

// Placeholder for GAS Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwmTGd5mL2GEerxo3kSseLCohf9R1k8o8EsuUlHb_BiL_Zzl_tz5UQety7_hGla_AcVUg/exec';

// Drive image IDs (extracted from the provided view links)
const IMG_DATE = 'https://drive.google.com/uc?export=view&id=1w_ElvpqzEtiloT54fV_rJGDP-4bKJDTa';
const IMG_SEARCH = 'https://drive.google.com/uc?export=view&id=14mH_yCRAI-v_E8HxNzlMgOYpI8m4dSTv';
const IMG_PHONE = 'https://drive.google.com/uc?export=view&id=1UA0YESX5K_Qw_Pcoya3jl9XRNmYQukSZ';

function App() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Form State
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch and parse users CSV
    Papa.parse(USERS_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        // Filter out empty rows
        const validUsers = results.data.filter(row => row.name || row.ShopName || row.BoothCode || row.CustCode);
        setUsers(validUsers);
        setLoadingUsers(false);
      },
      error: (err) => {
        console.error('Error fetching CSV:', err);
        setErrorMsg('ไม่สามารถดึงข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
        setLoadingUsers(false);
      }
    });

    // Close autocomplete on click outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    if (val.length > 1) {
      const lowerVal = val.toLowerCase();
      const results = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerVal)) ||
        (u.ShopName && u.ShopName.toLowerCase().includes(lowerVal)) ||
        (u.BoothCode && u.BoothCode.toLowerCase().includes(lowerVal)) ||
        (u.CustCode && u.CustCode.toLowerCase().includes(lowerVal))
      );
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedUser) {
      setErrorMsg('กรุณาค้นหาและเลือกร้านค้าของคุณก่อน');
      return;
    }
    
    if (!phone) {
      setErrorMsg('กรุณากรอกเบอร์โทรติดต่อ');
      return;
    }

    if (GAS_URL.includes('ใส่_WEB_APP_URL')) {
      alert("⚠️ สำหรับแอดมิน: กรุณานำ Web App URL ของ Google Apps Script มาใส่ในไฟล์ App.jsx ที่ตัวแปร GAS_URL ก่อนจึงจะบันทึกได้");
      // Simulate success for demo if URL not set
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
      }, 1000);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      orderDate,
      custCode: selectedUser.CustCode,
      boothCode: selectedUser.BoothCode,
      shopName: selectedUser.ShopName,
      name: selectedUser.name,
      phone,
      quantity
    };

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setSubmitSuccess(true);
      } else {
        setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + result.message);
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="app-container">
        <div className="glass-card success-message">
          <div className="success-icon">✅</div>
          <h2>สั่งซื้อสำเร็จ!</h2>
          <p>ระบบได้บันทึกข้อมูลการสั่งซื้อน้ำยาชีวภาพเรียบร้อยแล้ว</p>
          <button className="btn-submit" onClick={() => window.location.reload()} style={{ marginTop: '20px', width: 'auto', padding: '10px 20px' }}>
            สั่งซื้ออีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="glass-card">
        <h1>สั่งซื้อน้ำยาชีวภาพ</h1>
        <p className="subtitle">กรุณากรอกข้อมูลเพื่อสั่งซื้อน้ำยาชีวภาพ</p>
        
        {errorMsg && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', background: '#ffebee', padding: '10px', borderRadius: '8px' }}>{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* 1. Date */}
          <div className="form-group">
            <label className="required">1. วันที่สั่งซื้อ</label>
            <input 
              type="date" 
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />
            {/* Image reference */}
            <img src={IMG_DATE} alt="Date Step" className="reference-image" onError={(e) => e.target.style.display='none'} />
          </div>

          {/* 2. Customer Search */}
          <div className="form-group" ref={searchRef}>
            <label className="required">2. ค้นหาข้อมูลร้านค้า / รหัสลูกค้า / รหัสแผง</label>
            
            {loadingUsers ? (
              <div style={{ padding: '10px', color: '#666' }}>กำลังโหลดฐานข้อมูล...</div>
            ) : !selectedUser ? (
              <>
                <input 
                  type="text" 
                  placeholder="พิมพ์ชื่อร้าน, รหัสบูธ (เช่น 0101) หรือรหัสลูกค้า..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user, idx) => (
                      <div key={idx} className="search-item" onClick={() => handleSelectUser(user)}>
                        <div className="search-item-title">{user.ShopName || 'ไม่มีชื่อร้าน'} ({user.BoothCode})</div>
                        <div className="search-item-desc">ผู้เช่า: {user.name} | รหัส: {user.CustCode}</div>
                      </div>
                    ))}
                  </div>
                )}
                <img src={IMG_SEARCH} alt="Search Step" className="reference-image" onError={(e) => e.target.style.display='none'} />
              </>
            ) : (
              <div className="selected-card">
                <div className="selected-info">
                  <div><strong>ร้าน:</strong> {selectedUser.ShopName || '-'}</div>
                  <div><strong>รหัสบูธ:</strong> {selectedUser.BoothCode}</div>
                  <div><strong>ผู้เช่า:</strong> {selectedUser.name}</div>
                </div>
                <button type="button" className="btn-clear" onClick={clearSelection}>เปลี่ยน</button>
              </div>
            )}
          </div>

          {/* 3. Phone */}
          <div className="form-group">
            <label className="required">3. เบอร์โทรติดต่อ</label>
            <input 
              type="tel" 
              placeholder="08X-XXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <img src={IMG_PHONE} alt="Phone Step" className="reference-image" onError={(e) => e.target.style.display='none'} />
          </div>

          {/* 4. Quantity */}
          <div className="form-group">
            <label className="required">4. จำนวนน้ำยาชีวภาพที่ต้องการ (แกลลอน/ขวด)</label>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting || !selectedUser || !phone}>
            {isSubmitting ? <><span className="loader"></span> กำลังส่งข้อมูล...</> : 'ยืนยันการสั่งซื้อ'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default App;
