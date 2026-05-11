// ============================================================
// BMpro - JAVASCRIPT GLOBAL
// Fungsi-fungsi yang digunakan di semua halaman
// ============================================================

// ========== KONFIGURASI OPENSHEET ==========
const SHEET_ID = '1mosLZD23_3YDcuzi2diUY2TRNBSigJ2HNiiiFGPWtzo';
const OPENSHEET_BASE = `https://opensheet.elk.sh/${SHEET_ID}`;

// ========== FORMAT HARGA ==========
function formatPrice(price) {
  if (!price) return 'Hubungi';
  const num = parseInt(price.toString().replace(/\D/g, '')) || 0;
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
  const defaultImage = 'https://lh3.googleusercontent.com/d/1aBSLJypeJm4tqsXRiUhO97NPJpRq-ZcK=w400';
  
  return [
    { 
      'nama property': 'Ruko Bisnis Strategis', 
      'harga': '99000000', 
      'lokasi': 'Tiban', 
      'kt': '4', 
      'km': '2', 
      'lt': '2', 
      'sales': 'Marketing BMpro',
      'kontak': '6281234567890',
      'spesifikasi': 'Ruko 2 lantai, lokasi strategis dekat pasar',
      'gambar utama': defaultImage,
      '_tab': 'primary' 
    },
    { 
      'nama property': 'Rumah Mewah 2 Lantai', 
      'harga': '2350000000', 
      'lokasi': 'Batam Center', 
      'kt': '5', 
      'km': '4', 
      'lt': '3', 
      'sales': 'Marketing BMpro',
      'kontak': '6281234567890',
      'spesifikasi': 'Rumah mewah dengan fasilitas premium',
      'gambar utama': defaultImage,
      '_tab': 'secondary' 
    },
    { 
      'nama property': 'Apartemen Modern', 
      'harga': '850000000', 
      'lokasi': 'Nagoya', 
      'kt': '3', 
      'km': '2', 
      'lt': '1', 
      'sales': 'Marketing BMpro',
      'kontak': '6281234567890',
      'spesifikasi': 'Apartemen dengan view kota',
      'gambar utama': defaultImage,
      '_tab': 'rent' 
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
