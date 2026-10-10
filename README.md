# Yakınım Next · alternatif ürün yaklaşımı

**Bağımsız tasarım ve uygulama alternatifi · 10 Ekim 2026**

Bu depo, mevcut Yakınım'ı **üretim üzerinde değiştirmeden** ikinci bir ürün yaklaşımını karşılaştırmak amacıyla hazırlanmıştır. Eski sayfa düzenini kopyalamaz: keşif, harita, şehir hizmetleri, kaydedilen yerler ve diğer içerikleri yeni bir mobil bilgi mimarisi altında sunar. **Veri sağlayıcılarına ait `/api` ve `/lib` katmanı bilinçli olarak korunmuştur.** Bu bir Vercel Preview adayıdır; canlı cihaz/servis testlerinin tamamlandığı iddia edilmez.

## Denemek için

Node.js 22. ZIP'teki dosyaları GitHub'daki **yeni bir deponun köküne** aktarın.

```bash
npm ci
npm run dev
```

Tarayıcıda `http://localhost:5173/?preview` açın. Bu URL yalnızca **örnek yakın yerler** gösterir; gerçek işletme değildir. Arayüz hata/boş/konumsuz durumları da destekler:

- `/?preview&state=error` — kaynak hatası örneği
- `/?preview&state=empty` — boş sonuç örneği
- `/?preview&state=location` — konumsuz başlangıç örneği

ÖNEMLİ: `npm run dev` Vercel'in `/api/*` fonksiyonlarını tek başına çalıştırmaz. Canlı sağlayıcıları denemek için Vercel Preview veya Vercel Dev kullanın. **`docs/tasarim-onizleme.html`**, bağımlılık kurulmadan görüntülenebilen statik bir yerleşim maketidir; çalışan uygulama değildir.

## Yayına hazırlık

```bash
npm run test:unit
npm run build
npm run test:mobile
```

`npm run build` TypeScript kontrollerinden sonra Vite `dist/` oluşturur. `npm run test:mobile` Playwright Chromium ve WebKit tarayıcılarını gerektirir. Vercel: Framework **Vite**, Build Command `npm run build`, Output Directory `dist`, Root Directory depo kökü. Sunucusuz API fonksiyonları `api/*.js` yolunda kalır. `vercel.json` gereken fonksiyon sürelerini ve güvenlik başlıklarını korur.

### Bilinen doğrulama durumu

İnceleme ortamında internet/DNS kapalı olduğundan `npm ci` indirilemedi. Bu nedenle bu ZIP için **başarılı üretim build'i veya gerçek iPhone Safari çalıştırması doğrulanmadı**. Bağımsız modül testleri ve TypeScript/JS sözdizimi analizleri çalıştırıldı. Ayrıntı: [TEST-SONUCLARI.md](TEST-SONUCLARI.md). GitHub Actions iş akışı (`.github/workflows/ci.yml`) ağ erişimi olan bir CI'da build + Playwright testlerini çalıştıracak biçimde hazırdır.

## Yeni arayüz

- **Keşfet:** tek arama, 8 hızlı kategori, detaylı kategori filtreleri, en yakın yerlerin okunabilir listesi
- **Harita:** MapLibre/OpenFreeMap katmanı, sonuç işaretçileri, harita üzerinden konum belirleme
- **Hizmetler:** market ürün fiyatları, Antalya ulaşım, trafik, etkinlikler, kesintiler, balıkçılık
- **Kaydedilen:** eski kimlik kayıtlarıyla uyumlu; yeni kayıtlar yer bilgisiyle bu cihazda saklanır
- **Diğer:** haber, radyo oynatıcı, açık kaynak lisanslı oyunlar

Telefonda beş sekmeli sabit alt menü, geniş ekranda yan menü ve liste–harita bölünmüş ekran kullanılır. Gereksiz tanıtım, büyük banner ve animasyon yoktur. iPhone Safari için 16 px arama girişi ve güvenli alan dolguları (safe-area) vardır. Konum istemi yalnızca kullanıcı eylemiyle açılır. Harita erişilemezse **manuel enlem/boylam girişi** bulunur. Konumun son kullanılan kopyası en fazla 6 saat cihazda saklanır ve silinebilir.

### Veri bütünlüğü

- Market fiyatları `/api/prices`, toplu ulaşım `/api/transit`, nöbetçi eczane `/api/duty`, etkinlikler `/api/events`, kesintiler `/api/outages`, balıkçılık `/api/fishing` kullanır.
- Harita/yer keşfi `/api/viewport`, `/api/overture`, `/api/nearby` kaynaklarına bağlıdır; harita katmanı OpenFreeMap'tir.
- Nöbetçi eczane alternatif kaynağı resmî kaynak gibi gösterilmez. Kaynak hatası boş sonuç sayılmaz. Canlı veri kapsaması eksiksiz değildir.
- `/?preview` modundaki temsili kayıtlar **gerçek veri değildir**; burada kaydetme işlemi sadece sayfa belleğinde tutulur.
- Konum harici veri kaynaklarıyla paylaşılabilir. Gerçek konumunu paylaşmak istemeyen kullanıcı yaklaşık nokta veya koordinat girebilir.
- PWA statik kabuğu çevrimdışı önbellekler; **API yanıtları ve harita döşemeleri önbelleğe alınmaz**. Çevrimdışı canlı servisler çalışmaz.

## Kod haritası

| Konum | Sorumluluk |
|---|---|
| `src/App.tsx` | Beş ana alanın yönlendirilmesi; yeni UX akışları |
| `src/components/next/` | Yeni menü, arama, kategoriler, yer listesi, erişilebilir detay |
| `src/hooks/useDeviceLocation.ts` | Cihaz konumu, izin ve hassasiyet iyileştirme akışı |
| `src/features/useNearby.ts` | Tanımlı kapsamlı API sorguları ve kaynak durumları |
| `src/domain/geo.ts` | Konum doğrulaması, mesafe, sıralama, arama |
| `src/services/`, `src/components/` | Önceki servis adaptörleri ve işlevsel modüller |
| `src/store.ts` | Yerel konum, favori kimlikleri ve kayıt anlık görüntüleri |
| `src/next.css` | Yeni mobile-first tasarım sistemi |
| `api/`, `lib/` | KORUNAN sunucu işlevleri ve veri normalleştiricileri |
| `public/` | PWA kabuğu, yeni ikonlar ve lisanslı oyunlar |
| `tests/next-domain.mjs`, `tests/e2e/next.spec.ts` | Yeni yaklaşımın testleri |

Bu yaklaşımın gerekçeleri ve sonraki aşama mimari önerileri: [YAKLASIM.md](YAKLASIM.md). Eski yaklaşımla farklar: [KARSILASTIRMA.md](KARSILASTIRMA.md).
