# Yakınım Next · Test sonuçları

**Tarih:** 10 Ekim 2026. **Ortam:** Node.js v22.16.0; ağ/DNS erişimi kapalı çalışma konteyneri.

## Çalışan doğrulamalar

| Test | Sonuç | Not |
|---|---|---|
| `tests/next-domain.mjs` | BAŞARILI | 15 assertion: koordinat, konum kapsamı, mesafe, arama, sıralama, mutasyon yok |
| `tests/duty.mjs` | BAŞARILI | Nöbetçi eczane ayrıştırma |
| `tests/viewport.mjs` | BAŞARILI | Viewport ve cache davranışları |
| `tests/overture.mjs` | BAŞARILI | Overture veri şekli |
| `tests/media.mjs` | BAŞARILI | Haber/radyo kaynakları |
| `tests/prices.mjs` | BAŞARILI | Paket, fiyat, şube ve tazelik kontrolleri |
| `tests/fishing.mjs` | BAŞARILI | Hava/deniz tahmini ve kaynak bozulması |
| `tests/discovery.mjs` | BAŞARILI | Keşif normalleştirme |
| `tests/city-services.mjs` | BAŞARILI | Etkinlik/kesinti konuları |
| `tests/pilot.mjs` | BAŞARILI | Antalya ulaşım senaryoları |
| `tests/location-label.mjs` | BAŞARILI | Konum etiketi |
| `tests/model1-data.mjs` | BAŞARILI | Eczane kaynak dengesi, medya açıklamaları |
| TypeScript `transpileModule` sözdizimi | BAŞARILI | 33 TS/TSX/JS dosyası, 0 sözdizim hatası |
| PostCSS ayrıştırma | BAŞARILI | Yeni ve mevcut CSS sözdizimi |
| `node --check` | BAŞARILI | Sunucu `api/` ve `lib/` JS/CJS dosyaları |

## Bu ortamda çalıştırılamayanlar

| Komut | Durum / gerekçe |
|---|---|
| `npm ci --offline` | **ENGELLENDİ**: npm cache içinde `zustand` ve diğer paketler yok (`ENOTCACHED`) |
| `npm run build` | **ÇALIŞTIRILAMADI**: React, Vite ve diğer npm bağımlılıkları kurulamadı; production build başarısı doğrulanmadı |
| `tsc --noEmit` (tam semantik) | **TAMAMLANAMADI**: Npm bağımlılıkları/React tipleri eksik; ayrı sözdizimi doğrulaması yapıldı |
| `npm run test:mobile` | **ÇALIŞTIRILAMADI**: Playwright bağımlılıkları ve tarayıcı motorları kurulu değil |
| Gerçek iPhone Safari | **TEST EDİLMEDİ**: fiziksel cihaz ve gerçek Safari izin davranışı burada yok |
| Canlı Vercel API, PWA kurulumu/yenileme, harita döşemeleri | **DOĞRULANAMADI**: ağ/dağıtım ortamı eksik |
| Statik görsel önizleme PNG üretimi | **TAMAMLANAMADI**: sistem Chromium'u headless görüntü yakalama aşamasında zaman aşımına uğradı; `docs/tasarim-onizleme.html` mevcuttur |

Bir eski `discovery-extensions.mjs` testi yerel `typescript` paketini bulamadığından çalıştırılamadı; bu, bağımlılık kurulum engeliyle ilişkilidir ve yeni UI testi değildir.

## Yayından önce kabul listesi

1. Yeni GitHub deposuna yükle; `npm ci && npm run build && npm run test:mobile` çalıştır; başarısızlıklarda dağıtımı durdur.
2. Vercel Preview'da `/api/viewport`, `/api/overture`, `/api/duty`, `/api/prices`, `/api/transit`, `/api/events`, `/api/outages`, `/api/fishing` ağ yanıtları ve kaynak durumlarını doğrula.
3. iPhone Safari'de ilk izin, ret, Safari ayarından geri verme, yaklaşık GPS → hassas GPS, manuel koordinat, haritadan seçim, arka plana geçme ve geri dönüşü test et.
4. 360 / 390 / 430 px mobil ve 1080+ px masaüstünde yatay taşma, alt menü, klavye açılması, modal kapama ve harita boyutlarını kontrol et.
5. Önizleme `/?preview` temsili uyarı gösteriyor mu, gerçek URL'de örnek işletme sızıntısı var mı kontrol et.
6. PWA güncelleme, çevrimdışı davranış ve favorilerin cihazda kalması kontrol edilsin.
7. Güvenilirlik değerlendirmesinde kaynak hatası ile gerçekten boş liste ayrımı kontrol edilsin.

Bu raporda tamamlanmayan doğrulamalar başarılı olarak etiketlenmemiştir.
