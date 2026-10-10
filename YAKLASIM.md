# Yakınım'ı yeniden tasarlasaydım: ürün ve mühendislik yaklaşımı

## Kısa karar

Yakınım için **tamamen yeni bir ürün deneyimi** kurar; ama çalışan sunucu bağlayıcılarını sırf yeniden yazmış olmak için değiştirmezdim. Kullanıcı için değer, daha fazla kart ve animasyonda değil, en kısa sürede **güvenilir ve kullanılabilir yakın çevre bilgisi** göstermekten gelir. Bu ikinci sürümde React/Vite ve mevcut serverless servisler korunmuş, uygulama akışı ve görsel tasarım yeni kurgulanmıştır.

## Kararlar ve gerekçeler

| Öncelik | Karar | Gerekçe | Bu sürüm |
|---|---|---|---|
| P0 | Konum iznini yalnız açık kullanıcı eylemiyle istemek | iPhone Safari'de güvenilir izin akışı, gizlilik, daha az sürtünme | Uygulandı |
| P0 | Her API sorgusunu konum kapsamıyla anahtarlamak | Yanlış mahalleden bilgi gösterme riskini azaltmak | Uygulandı |
| P0 | API hatasını "kayıt yok" saymamak | Sahte kesinlik ve kullanıcı güveni kaybını önlemek | Uygulandı / mevcut kaynak yapısına bağlı |
| P0 | 5 ana işlem alanı: Keşfet, Harita, Hizmetler, Kaydedilen, Diğer | Tek elle erişim ve modüllerin bulunabilirliği | Uygulandı |
| P1 | Desktop'ta liste–harita beraber | Masaüstünün geniş alanından gerçek fayda sağlamak | Uygulandı |
| P1 | Yer kaydını ayrıntılarıyla yerelde tutmak | Önceki konumdan favorilerin kaybolmasını önlemek | Uygulandı |
| P1 | Manuel koordinat seçeneği | Harita karosu/GPS erişimi başarısız olsa da devam edebilmek | Uygulandı |
| P1 | Gerçek mobil tarayıcı ve veri sağlayıcı kontrat testleri | Görsel ve servis regresyonlarını azaltmak | CI testleri eklendi; çalıştırma bekleniyor |
| P2 | Servis sonuçlarında her kayıt için kaynak ve güncellik sözleşmesi | Tutarlı veri güven seviyesi | Kısmi; servis başına sözleşme gerekli |
| P2 | Kaynak bazında iş yükü/kota/circuit breaker | Ani dış servis kesintilerinde yanıt süresi ve maliyet kontrolü | Mevcut cache stratejisi korundu; yeni servis katmanı yazılmadı |
| P2 | Yakınlık dışında açık/kapalı, veri tarihi, erişilebilirlik filtresi | Gerçek kullanım değerini artırmak | Veri doğruluğu sağlandığında önerilir |
| P3 | Kullanıcı hesabı ve cihazlar arası senkronizasyon | Favorilerin farklı cihazlara taşınması | Bilinçli olarak eklenmedi: sunucu/veritabanı ve gizlilik yükü |

## Görsel tasarım

- Fonksiyonel marka: koyu orman yeşili, açık yüzey, yumuşak adaçayı, sınırlı vurgu. Aydınlık tema.
- Mobilde ilk ekranda logo/konum, arama, hızlı kategoriler ve yakındaki yerler. Giriş formu, promosyon ve çok ekranlı onboarding yok.
- Bütün ana hedefler tek elle alt menüden ulaşılır. Harita ayrıntı kapakları gerçek `role=dialog` kullanır. 44 px civarında etkileşim hedefleri, 16 px girdi yazıları ve iOS safe-area alanları gözetilir.
- Masaüstünde sabit yan menü + liste ve harita aynı anda görünür. 1080 px altında gereksiz harita bileşeni Keşfet içinde oluşturulmaz, ayrı Harita alanı kullanılır.
- Hizmetler tek bir sayfada bulunabilir; veri modüllerinin iç mantıkları korunur.
- Hareketli açılışlar, uzun pazarlama sayfaları, gösterişli gereksiz animasyonlar yok.

## Mimari yaklaşım

```
React App / yeni Shell / yeni Liste / Harita
        |
        +-- useDeviceLocation --> Zustand (son konum, yerel tercihler)
        +-- useNearby -------> React Query --> /api/* Vercel Functions
        +-- Servis modülleri ---------------> /api/* Vercel Functions
                                              |
                                              +-- mevcut normalleştiriciler / lib/*
                                              +-- mevcut açık veri kaynakları
```

**Neden framework geçişi yok?** Next.js, SvelteKit veya React Router'a geçmek bu aşamada somut bir kullanıcı problemi çözmüyor. Mevcut Vite yükleme, kod ayırma ve serverless API düzeni yeterli. Yeni ücretli harita, veri tabanı ve API anahtarı eklemedim.

**Neden servisler yeniden yazılmadı?** Veri tedarikine ait coğrafi kapsama, tarifeler, kaynağa özgü dönüştürmeler ve önbellek mantığı birikmiş iş bilgisi taşıyor. Bunların yeniden yazımı yüksek regresyon riski yaratır. Yeni mimari sınırı, önce bunları belirgin bir istemci sözleşmesine bağlamak ve test etmek olmalıdır.

**Kısıt ve riskler:** Eski `api` işlevlerinin çalışma zamanı gereksinimleri (ör. `overture` dinamik modülleri), gerçek dış API davranışı, iPhone Safari'nin konum izin durumları, harita sağlayıcısı kesintileri ve Vercel build'i ağ erişimi olmadan uçtan uca doğrulanamadı. Favoriler bu cihazdadır; tarayıcı verisi silinince kaybolabilir. Harita döşemeleri çevrimdışı çalışmaz.

## Kullanıcı kabul senaryoları

1. Konumu reddeden kullanıcı ana ekranı kullanırken haritadan veya koordinatla nokta seçebilir.
2. 2 farklı mahalleye geçildiğinde eski yerler yeni yakın çevreymiş gibi görünmez.
3. Nöbetçi eczanede alternatif kaynak kullanıldıysa uyarı görünür; detayda telefonla doğrulama önerilir.
4. Market fiyatında birden çok zincire ait aynı ürün/paket ayrımı kaybolmaz.
5. Antalya dışında ulaşım pilotu yanlış şekilde evrensel çalışıyormuş gibi görünmez.
6. Kullanıcı bir yeri kaydedip farklı kategoriye ve konuma geçince yerin bilgisi kalır.
7. Harita ve şehir hizmetleri ayrı alanlarda açılır; radyo oynatıcı başka sekmeye geçince korunur.
8. 360 px, 390 px ve masaüstü genişliklerinde yatay taşma oluşmaz.

## Daha sonraki gerçek yatırım alanı

Veri kalitesi için her `/api` yanıtına `source`, `fetchedAt`, `expiresAt`, `coverage`, `partial` ve boş kaynak/boş kayıt ayrımını veren ortak kontrat; ölçülebilir retry/circuit-breaker; kritik sağlayıcılara sentetik kontrol; gerçek cihaz Safari smoke; doğrudan kullanıcı testlerinden çıkan tap süreleri ve başarısız görev oranı. Bunlar veriyi değiştirmeden güvenilirliği yükseltir.
