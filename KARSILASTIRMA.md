# Karşılaştırma · mevcut geliştirilen sürüm ve Yakınım Next

| Başlık | Önceki yaklaşım | Yakınım Next alternatifi |
|---|---|---|
| Ana gezinme | Keşfet / Haber / Radyo / Oyun; alt modüller kategori şeridinde | Keşfet / Harita / Hizmetler / Kaydedilen / Diğer |
| Hizmetlere erişim | Kategori seçimi üzerinden | Tek hizmet merkezinden doğrudan |
| Mobil arayüz | Dikey liste ağırlıklı | İşlem öncelikli kısa arayüz; alt menü |
| Desktop | Dar, mobil genişliğinde sayfa | Sabit sol menü; iki panelli liste ve harita |
| Favoriler | Yer kimliği öncelikli | Kaydedilen yerin ayrıntılı yerel anlık görüntüsü |
| Konum | GPS / harita seçimi | GPS / harita / manuel koordinat; kullanıcı talebiyle izin |
| Harita | MapLibre + OpenFreeMap | Aynı motor ve kaynak, yeni yerleşim |
| Fiyat / ulaşım / balıkçılık / eczane | Mevcut servisler | Aynı servisleri tekrar kullanan ayrı hizmet ekranları |
| Veri sağlayıcıları | Vercel Functions | Aynı Vercel Functions; pahalı API gereksinimi eklenmedi |
| Test | Eski UI için çok sayıda tarihsel kontrol | Yeni UI testleri ve API uyumluluk testleri ayrı |
| Dağıtım | Orijinal GitHub/Vercel | Bağımsız repository + Vercel Preview |

**Karşılaştırma önerisi:** İki sürüm için aynı cihaz, konum ve test senaryolarını kullanın. Değerlendirmeyi (1) gerekli yere ulaşma süresi, (2) hata/boş durumların anlaşılırlığı, (3) tek elle kullanım, (4) harita tepkiselliği, (5) arama/favoriler, (6) canlı veri doğruluğu başlıklarında yapın. Veri kaynakları eşit tutulduğundan kullanılabilirlik farkını daha net ölçebilirsiniz.

**Önemli:** Yeni tasarım daha iyi göründüğü için otomatik olarak daha güvenilir değildir. Üretime geçişten önce `npm ci`, `npm run build`, iPhone Safari testi, API sözleşmeleri, PWA ve gerçek saha senaryoları doğrulanmalıdır.
