# Yakınım Next · Değişiklik kaydı

## Yeni mimari ve tasarım

- `src/App.tsx`: beş sekmeli yeni bilgi mimarisi; mobil alt bar, masaüstü liste–harita.
- `src/next.css`: yeni responsive tasarım sistemi; minimum hareket, iOS safe-area, erişilebilir dokunma hedefleri.
- `src/components/next/catalog.ts`: kategori, servis ve gezinme tanımları.
- `src/components/next/Shell.tsx`: konum menüsü, veri durumları ve gezinme.
- `src/components/next/Places.tsx`: hızlı kategoriler, kategori filtreleri, arama, yer listesi, kaydetme ve detay alt sayfası.
- `src/hooks/useDeviceLocation.ts`: istek temelli GPS, hassasiyet iyileştirme, iptal ve temizleme.
- `src/features/useNearby.ts`: konum kapsamlı React Query sorguları ve mevcut sağlayıcıların birleştirilmesi.
- `src/domain/geo.ts`: doğrulama, mesafe, konum kapsamı, Türkçe arama ve sıralama.
- `src/store.ts`: önceki favori kimliği sistemi korunarak yeni yer anlık görüntüsü saklaması eklendi.
- Harita yer işaretleriyle uygulama rengi eşleştirildi; PWA ikonu güncellendi; PWA önbellek sürümü ayrıldı.
- Eski React bileşenleri üzerinden fiyat, ulaşım, trafik, etkinlik, kesinti, balıkçılık, hava, haber, radyo ve lisanslı oyunlar kullanılmaya devam eder.

## Korunan fonksiyonlar

`api/` ve `lib/` altındaki veri bağlayıcılar ve mevcut normalleştiriciler değiştirilmedi. `src/services/api.ts`, `src/services/forecast.ts`, `src/services/fishing-storage.ts`, `src/components/PilotViews.tsx` ve servis modülleri korundu. Kaynaklar haricinde ücretli/anahtarlı API eklenmedi. Mevcut Android kimliği/hosting bağlantısı yeni Vercel Preview'ya taşınmadı.

## Temizlik ve kapsam

Yeni aktif uygulamada kullanılmayan eski statik giriş dosyaları, eski tasarım dosyaları ve anahtara/Android imzasına bağlı yayın kalıntıları ayrıldı. Eski UI testleri yeni tasarım testleriyle karıştırılmadı. `tests/e2e/next.spec.ts` eklendi, `tests/next-domain.mjs` çalıştırıldı, CI `npm ci`/build/Playwright üzerine yeniden kuruldu.

## Bilinçli olarak yapılmayanlar

- Dış sağlayıcıları veya ücretli harita servisini değiştirmek
- Kullanıcı hesabı, yeni veritabanı, API anahtarı, izleyici analitiği eklemek
- Verisi doğrulanamayan işletme/eczane/market verisini gerçek gibi göstermek
- iPhone Safari ve Vercel build'i doğrulanmış gibi raporlamak
