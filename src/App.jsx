import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import './index.css';

// URLs
const USERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOeBTcG5H5NUM24qhWDyxIl9yVqL2ql3lcHHJIzUbHcA7n_Ry5R9JTOfOXiXWiFrME0X2a7M5bqvX8/pub?gid=584278207&single=true&output=csv';

// GAS Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzI9weEJZDJIpIHAOOm8-2p0a78arTlJM5ocqpncuDuBInqVU9vLOCm0nJn1icps25gTw/exec';

// Image references
const IMG_DATE = 'https://drive.google.com/uc?export=view&id=1w_ElvpqzEtiloT54fV_rJGDP-4bKJDTa';
const IMG_SEARCH = 'https://drive.google.com/uc?export=view&id=14mH_yCRAI-v_E8HxNzlMgOYpI8m4dSTv';
const IMG_PHONE = 'https://drive.google.com/uc?export=view&id=1UA0YESX5K_Qw_Pcoya3jl9XRNmYQukSZ';

import img1 from './assets/img1.jpg';
import img2 from './assets/img2.jpg';
import img3 from './assets/img3.jpg';
import img4 from './assets/img4.jpg';
import img5 from './assets/img5.jpg';
import img6 from './assets/img6.jpg';
import img7 from './assets/img7.jpg';

// Product Catalog
const CATALOG = [
  { id: 'p1', name: 'น้ำยาชีวภาพขนาดใหญ่ 3.8 ลิตร', price: 160, hasScent: true, unit: 'แกลลอน' },
  { id: 'p2', name: 'น้ำยาชีวภาพขนาดเล็ก 1 ลิตร', price: 68, hasScent: true, unit: 'แกลลอน' },
  { id: 'p3', name: 'จุลินทรีย์ผงขนาด 1 กิโล', price: 332, hasScent: false, unit: 'ถุง' }
];

const SCENTS = ['มะกรูด', 'มะนาว', 'สับปะรด'];

const PRODUCT_IMAGES = {
  p1: {
    'มะกรูด': img6, // รูปขวดใหญ่มะกรูด
    'มะนาว': img7,  // รูปขวดใหญ่มะนาว
    'สับปะรด': img5 // รูปขวดใหญ่สับปะรด
  },
  p2: {
    'มะกรูด': img2,
    'มะนาว': img3,
    'สับปะรด': img4
  },
  p3: {
    default: img1
  }
};

function ProductItem({ prod, onAdd, onPreview }) {
  const [selectedScent, setSelectedScent] = useState(SCENTS[0]);
  const currentImage = prod.hasScent ? PRODUCT_IMAGES[prod.id][selectedScent] : PRODUCT_IMAGES[prod.id].default;

  return (
    <div className="product-item">
      <img 
        src={currentImage} 
        alt={prod.name} 
        className="product-image clickable-image" 
        onClick={() => onPreview(currentImage)}
      />
      <div className="product-info">
        <strong>{prod.name}</strong>
        <span className="price-tag" style={{display: 'block', marginBottom: '5px'}}>{prod.price} บาท/{prod.unit}</span>
        {prod.hasScent && (
          <select value={selectedScent} onChange={e => setSelectedScent(e.target.value)} className="scent-select">
            {SCENTS.map(scent => <option key={scent} value={scent}>กลิ่น{scent}</option>)}
          </select>
        )}
      </div>
      <button type="button" className="btn-add" onClick={() => onAdd(prod, selectedScent)}>
        + เพิ่ม
      </button>
    </div>
  );
}

function App() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Form State
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [phone, setPhone] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  
  // File State
  const [slipFile, setSlipFile] = useState(null);
  const [slipBase64, setSlipBase64] = useState('');
  const [slipMimeType, setSlipMimeType] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Image Preview State
  const [previewImage, setPreviewImage] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    Papa.parse(USERS_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const validUsers = results.data.filter(row => 
          (row.name || row.ShopName || row.CustCode) && 
          (row.ContractStatus && row.ContractStatus.toLowerCase() === 'active')
        );
        setUsers(validUsers);
        setLoadingUsers(false);
      },
      error: (err) => {
        console.error('Error fetching CSV:', err);
        setErrorMsg('ไม่สามารถดึงข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
        setLoadingUsers(false);
      }
    });

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
        (u.CustCode && u.CustCode.toLowerCase().includes(lowerVal))
      );
      setSearchResults(results.slice(0, 10));
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

  // --- Cart Logic ---
  const addToCart = (product, scent) => {
    setCart([...cart, { 
      ...product, 
      cartId: Math.random().toString(), 
      quantity: 1,
      selectedScent: product.hasScent ? scent : null
    }]);
  };

  const updateCartItem = (cartId, field, value) => {
    setCart(cart.map(item => item.cartId === cartId ? { ...item, [field]: value } : item));
  };

  const removeCartItem = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- File Upload Logic ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ไฟล์ภาพใหญ่เกินไป (จำกัด 5MB)");
        e.target.value = '';
        return;
      }
      setSlipFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result; // data:image/png;base64,iVBORw0KGgo...
        const base64Str = dataUrl.split(',')[1];
        const mime = dataUrl.split(';')[0].split(':')[1];
        setSlipBase64(base64Str);
        setSlipMimeType(mime);
      };
      reader.readAsDataURL(file);
    }
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
    if (cart.length === 0) {
      setErrorMsg('กรุณาเลือกสินค้าที่ต้องการสั่งซื้ออย่างน้อย 1 รายการ');
      return;
    }
    if (!slipBase64) {
      setErrorMsg('กรุณาแนบสลิปโอนเงิน');
      return;
    }

    setIsSubmitting(true);

    // Format order summary string
    const summaryList = cart.map(item => 
      `${item.name}${item.hasScent ? ` (กลิ่น${item.selectedScent})` : ''} x${item.quantity} ${item.unit}`
    ).join(' | ');

    const payload = {
      orderDate,
      custCode: selectedUser.CustCode,
      boothCode: selectedUser.BoothCode,
      shopName: selectedUser.ShopName,
      name: selectedUser.name,
      phone,
      orderSummary: summaryList,
      cartItems: cart,
      totalPrice: totalPrice,
      slipBase64: slipBase64,
      slipMimeType: slipMimeType
    };

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setSubmitSuccess(true);
      } else {
        setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + result.message);
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ หรือเซิร์ฟเวอร์ไม่ได้เปิดสิทธิ์ CORS (อนุญาตให้ข้ามโดเมน)');
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
          <p>ระบบได้บันทึกข้อมูลการสั่งซื้อและสลิปเงินของคุณเรียบร้อยแล้ว</p>
          <button className="btn-submit" onClick={() => window.location.reload()} style={{ marginTop: '20px', width: 'auto', padding: '10px 20px' }}>
            สั่งซื้อเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setPreviewImage(null)}>✕</button>
            <img src={previewImage} alt="Preview" className="preview-large-image" />
          </div>
        </div>
      )}

      <div className="glass-card">
        <h1>สั่งซื้อน้ำยาชีวภาพ</h1>
        <p className="subtitle">กรอกข้อมูล เลือกสินค้า และแนบสลิปเพื่อยืนยัน</p>
        
        {errorMsg && <div className="error-box">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="required">1. วันที่สั่งซื้อ</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
          </div>

          <div className="form-group" ref={searchRef}>
            <label className="required">2. ค้นหาข้อมูลร้านค้า / รหัสลูกค้า</label>
            {loadingUsers ? (
              <div style={{ padding: '10px', color: '#666' }}>กำลังโหลดฐานข้อมูล...</div>
            ) : !selectedUser ? (
              <>
                <input 
                  type="text" 
                  placeholder="พิมพ์ชื่อร้าน หรือ รหัสลูกค้า..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user, idx) => (
                      <div key={idx} className="search-item" onClick={() => handleSelectUser(user)}>
                        <div className="search-item-title">{user.ShopName || 'ไม่มีชื่อร้าน'}</div>
                        <div className="search-item-desc">ผู้เช่า: {user.name} | รหัสลูกค้า: {user.CustCode}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="selected-card">
                <div className="selected-info">
                  <div><strong>ร้าน:</strong> {selectedUser.ShopName || '-'}</div>
                  <div><strong>ผู้เช่า:</strong> {selectedUser.name}</div>
                  <div><strong>รหัสลูกค้า:</strong> {selectedUser.CustCode}</div>
                </div>
                <button type="button" className="btn-clear" onClick={clearSelection}>เปลี่ยน</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="required">3. เบอร์โทรติดต่อ</label>
            <input type="tel" placeholder="08X-XXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          {/* Catalog Section */}
          <div className="form-group catalog-section">
            <label className="required">4. เลือกสินค้าที่ต้องการ</label>
            <div className="product-list">
              {CATALOG.map(prod => (
                <ProductItem key={prod.id} prod={prod} onAdd={addToCart} onPreview={setPreviewImage} />
              ))}
            </div>
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="cart-container">
              <h3>ตะกร้าสินค้าของคุณ</h3>
              {cart.map((item) => (
                <div className="cart-item" key={item.cartId}>
                  <div className="cart-item-header">
                    <strong>{item.name}</strong>
                    <button type="button" className="btn-remove" onClick={() => removeCartItem(item.cartId)}>ลบ</button>
                  </div>
                  <div className="cart-item-controls">
                    {item.hasScent && (
                      <select 
                        value={item.selectedScent} 
                        onChange={(e) => updateCartItem(item.cartId, 'selectedScent', e.target.value)}
                        className="scent-select"
                      >
                        {SCENTS.map(scent => <option key={scent} value={scent}>กลิ่น{scent}</option>)}
                      </select>
                    )}
                    <div className="qty-control">
                      <span>จำนวน ({item.unit}):</span>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity === '' ? '' : item.quantity} 
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCartItem(item.cartId, 'quantity', val === '' ? '' : (parseInt(val) || 1));
                        }}
                        onBlur={(e) => {
                          // ถ้าผู้ใช้ปล่อยช่องว่างไว้แล้วเอาเมาส์ออก ให้กลับมาเป็น 1
                          if (item.quantity === '' || item.quantity < 1) {
                            updateCartItem(item.cartId, 'quantity', 1);
                          }
                        }}
                        className="qty-input"
                      />
                    </div>
                  </div>
                  <div className="cart-item-price">
                    รวม: {item.price * item.quantity} บาท
                  </div>
                </div>
              ))}
              
              <div className="total-summary">
                <span>ยอดชำระเงินรวมทั้งสิ้น:</span>
                <h2>{totalPrice} บาท</h2>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {totalPrice > 0 && (
            <div className="payment-section">
              <label className="required">5. ชำระเงินและแนบสลิป</label>
              <div className="bank-card">
                <div className="bank-logo">KTB</div>
                <div className="bank-details">
                  <strong>ธนาคารกรุงไทย</strong>
                  <p>บจก.สุวพีร์โฮลดิ้ง 2</p>
                  <h3>976-0-40781-7</h3>
                </div>
              </div>
              <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#555'}}>ยอดที่ต้องโอน: <strong>{totalPrice} บาท</strong></p>
              
              <div className="file-upload-wrapper">
                <label className="file-upload-btn">
                  แนบสลิปโอนเงิน
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                {slipFile && <span className="file-name">📎 {slipFile.name}</span>}
              </div>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={isSubmitting || !selectedUser || !phone || cart.length === 0 || !slipBase64}>
            {isSubmitting ? <><span className="loader"></span> กำลังบันทึกข้อมูลและอัปโหลด...</> : 'ยืนยันสั่งซื้อ'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default App;
