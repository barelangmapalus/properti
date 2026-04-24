// ============================================================
// BMpro - JAVASCRIPT GLOBAL
// Fungsi-fungsi yang digunakan di semua halaman
// ============================================================

// ========== KONFIGURASI OPENSHEET ==========
const SHEET_ID = '1e0-mHb2GCI-eVq8CrrxF3UlAz62CGQEAGlgmGRYBtPA';
const OPENSHEET_BASE = `https://opensheet.elk.sh/${SHEET_ID}`;

// ========== FORMAT HARGA ==========
function formatPrice(price) {
  if (!price) return 'Hubungi';
  const num = parseInt(price.toString().replace(/\D/g, '')) || 0;
  if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)} M`;
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

// ========== KONVERSI URL GOOGLE DRIVE ==========
function convertDriveUrl(url) {
  if (!url) return '';
  if (url.includes('lh3.googleusercontent.com')) return url;
  
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w400`;
  }
  
  const ucIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucIdMatch) {
    return `https://lh3.googleusercontent.com/d/${ucIdMatch[1]}=w400`;
  }
  
  if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
    return `https://lh3.googleusercontent.com/d/${url}=w400`;
  }
  
  return url;
}

// ========== KONVERSI NOMOR UNTUK WHATSAPP ==========
function convertToWaNumber(phone) {
  if (!phone) return '6281234567890';
  
  let cleaned = phone.toString().replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

// ========== OPENSHEET FETCH ==========
async function fetchSheetData(tabName) {
  try {
    const response = await fetch(`${OPENSHEET_BASE}/${tabName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${tabName}:`, error);
    return [];
  }
}

// ========== HAMBURGER MENU ==========
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (!hamburgerBtn || !sidebarMenu || !menuOverlay) return;
  
  const menuIcon = hamburgerBtn.querySelector('i');
  
  function openMenu() {
    sidebarMenu.classList.add('active');
    menuOverlay.classList.add('active');
    menuIcon.classList.remove('fa-bars');
    menuIcon.classList.add('fa-times');
    document.body.style.overflow = 'hidden';
  }
  
  function closeMenu() {
    sidebarMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    menuIcon.classList.remove('fa-times');
    menuIcon.classList.add('fa-bars');
    document.body.style.overflow = '';
  }
  
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebarMenu.classList.contains('active') ? closeMenu() : openMenu();
  });
  
  menuOverlay.addEventListener('click', closeMenu);
  
  let touchStartX = 0;
  sidebarMenu.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  sidebarMenu.addEventListener('touchend', (e) => {
    if (touchStartX - e.changedTouches[0].screenX > 40) closeMenu();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ========== TOGGLE FAVORITE ==========
function toggleFavorite(btn) {
  const icon = btn.querySelector('i');
  if (icon.classList.contains('far')) {
    icon.classList.remove('far'); icon.classList.add('fas');
    btn.style.background = '#e74c3c'; icon.style.color = 'white';
  } else {
    icon.classList.remove('fas'); icon.classList.add('far');
    btn.style.background = 'rgba(255,255,255,0.95)'; icon.style.color = '#e74c3c';
  }
}

// ========== DUMMY DATA ==========
function getDummyProperties() {
  return [
    { 
      'nama property': 'Ruko Bisnis', 
      'harga': '99000000', 
      'lokasi': 'Tiban', 
      'kt': '4', 
      'km': '10', 
      'lt': '2', 
      'sales': 'Toni',
      'kontak': '081234567899',
      'spesifikasi': 'Ruko ini untuk bisnis',
      'gambar utama': 'https://lh3.googleusercontent.com/d/10mZumMZTUW2piz9af9i4s-cUVm4hLQSA=w400',
      _tab: 'primary' 
    },
    { 
      'nama property': 'Apartemen City View', 
      'harga': '850000000', 
      'lokasi': 'Nagoya', 
      'kt': '2', 
      'km': '1', 
      'lt': '1', 
      'sales': 'Dewi',
      'kontak': '085678901234',
      'spesifikasi': 'Apartemen dengan view kota',
      'gambar utama': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', 
      _tab: 'secondary' 
    },
    { 
      'nama property': 'Rumah Minimalis', 
      'harga': '2100000000', 
      'lokasi': 'Batam Center', 
      'kt': '3', 
      'km': '2', 
      'lt': '1', 
      'sales': 'Budi',
      'kontak': '081298765432',
      'spesifikasi': 'Rumah minimalis lokasi strategis',
      'gambar utama': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', 
      _tab: 'rent' 
    }
  ];
}

// ========== INIT SEMUA HALAMAN ==========
document.addEventListener('DOMContentLoaded', function() {
  initHamburgerMenu();
});

// ========== FAVORIT / LOVE ==========
function toggleLove(btn, propertyData) {
  const icon = btn.querySelector('i');
  
  // Ambil data user
  const userData = JSON.parse(localStorage.getItem('bmpro_user') || 'null');
  
  if (!userData) {
    // User belum registrasi
    alert('Silakan registrasi terlebih dahulu untuk menyimpan favorit!\n\nKlik OK untuk menuju halaman registrasi.');
    window.location.href = 'register.html';
    return;
  }
  
  // Toggle love
  if (icon.classList.contains('far')) {
    // Tambah favorit
    icon.classList.remove('far');
    icon.classList.add('fas');
    btn.style.background = '#e74c3c';
    icon.style.color = 'white';
    
    saveFavorite(propertyData);
  } else {
    // Hapus favorit
    icon.classList.remove('fas');
    icon.classList.add('far');
    btn.style.background = 'rgba(255,255,255,0.95)';
    icon.style.color = '#e74c3c';
    
    removeFavorite(propertyData);
  }
}

function saveFavorite(property) {
  const favorites = JSON.parse(localStorage.getItem('bmpro_favorites') || '[]');
  
  // Cek duplikat
  const exists = favorites.find(f => 
    f['nama property'] === property['nama property'] && 
    f._tab === property._tab
  );
  
  if (!exists) {
    favorites.unshift(property);
    localStorage.setItem('bmpro_favorites', JSON.stringify(favorites));
    console.log('Favorit disimpan:', property['nama property']);
  }
}

function removeFavorite(property) {
  let favorites = JSON.parse(localStorage.getItem('bmpro_favorites') || '[]');
  favorites = favorites.filter(f => 
    !(f['nama property'] === property['nama property'] && f._tab === property._tab)
  );
  localStorage.setItem('bmpro_favorites', JSON.stringify(favorites));
  console.log('Favorit dihapus:', property['nama property']);
}

function isFavorite(propertyData) {
  const favorites = JSON.parse(localStorage.getItem('bmpro_favorites') || '[]');
  return favorites.some(f => 
    f['nama property'] === propertyData['nama property'] && 
    f._tab === propertyData._tab
  );
}

// ========== NOTIFIKASI WHATSAPP VIA FONNTE ==========
async function sendNotificationToAllUsers(propertyData) {
  try {
    // Ambil semua user dari Sheet "users"
    const users = await fetchSheetData('users');
    
    if (!users || users.length === 0) {
      console.log('Tidak ada user terdaftar');
      return;
    }
    
    // Kirim notifikasi ke setiap user
    for (const user of users) {
      const phone = convertToWaNumber(user['kontak']);
      const nama = user['nama'] || 'Pelanggan';
      const propertyName = propertyData['nama property'] || 'Properti Baru';
      const propertyPrice = formatPrice(propertyData['harga'] || '0');
      const propertyLocation = propertyData['lokasi'] || '-';
      
      const message = `🏠 *BMpro - Properti Baru!*\n\nHalo ${nama},\n\nAda properti baru nih:\n📌 *${propertyName}*\n💰 ${propertyPrice}\n📍 ${propertyLocation}\n\nKlik link untuk lihat detail:\nhttps://username.github.io/search.html\n\nSalam,\nBMpro Team`;
      
      // Kirim via Fonnte API (ganti dengan token Anda)
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': 'YOUR_FONNTE_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: phone,
          message: message
        })
      });
    }
    
    console.log(`Notifikasi terkirim ke ${users.length} user`);
  } catch (e) {
    console.error('Error sending notifications:', e);
  }
}
