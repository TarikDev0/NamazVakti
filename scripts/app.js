const API_URL = "https://api.aladhan.com/v1/timings";

const vakitAnahtarlar = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Sesli alarm için AudioContext
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep() {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
}

function alarmKur(vakitZamani, vakitAdi) {
  const simdi = new Date();
  const vakitTarihi = new Date(vakitZamani);
  const farkMs = vakitTarihi - simdi - 5 * 60 * 1000; // 5 dakika öncesi

  if (farkMs > 0) {
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Namaz Vakti Hatırlatması", {
          body: `${vakitAdi} namazı için 5 dakika kaldı.`,
          icon: "https://cdn-icons-png.flaticon.com/512/4403/4403710.png",
        });
      } else {
        alert(`${vakitAdi} namazı için 5 dakika kaldı!`);
      }
      beep();
    }, farkMs);
  }
}

function fetchCityName(lat, lon) {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
  )
    .then((res) => res.json())
    .then((data) => {
      const address = data.address || {};
      return address.city || address.town || address.village || "Bilinmeyen Konum";
    })
    .catch(() => "Konum bilgisi alınamadı");
}

function fetchPrayerTimes(lat, lon) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const timestamp = Math.floor(today.getTime() / 1000);

  fetch(`${API_URL}/${timestamp}?latitude=${lat}&longitude=${lon}&method=13`)
    .then((res) => res.json())
    .then(async (data) => {
      const timings = data.data.timings;
      const city = await fetchCityName(lat, lon);
      document.getElementById("location").innerText = city;

      vakitAnahtarlar.forEach((key) => {
        const time = timings[key];
        const timeEl = document.getElementById(`time-${key}`);
        if (timeEl) timeEl.textContent = time;

        // ISO string oluştur
        const tarihSaat = `${yyyy}-${mm}-${dd}T${time}:00`;

        alarmKur(tarihSaat, key);
      });
    })
    .catch(() => {
      document.getElementById("error").classList.remove("hidden");
    });
}

// Bildirim izni isteme
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      document.getElementById("error").classList.remove("hidden");
    }
  );
} else {
  document.getElementById("error").classList.remove("hidden");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker kaydı başarılı'))
      .catch(() => console.log('Service Worker kaydı başarısız'));
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');
  let deferredPrompt;

  // PWA yükleme hazırsa tetiklenir
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex'; // Butonu göster
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('Uygulamayı ana ekrana ekleme bildirimi şu anda kullanılamıyor. Lütfen tarayıcının menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.');
      return;
    }
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('Kullanıcı uygulamayı ana ekrana eklemeyi kabul etti.');
      installBtn.style.display = 'none';
    } else {
      console.log('Kullanıcı uygulamayı ana ekrana eklemeyi reddetti.');
    }
    deferredPrompt = null;
  });
});


