# Katkı rehberi

Geliştirme için Node.js 24.15+ (CI: Node 24 ve 26) ve npm kullanın.

```sh
npm ci --ignore-scripts
npm run validate
```

Kaynaklar `src/`, davranış testleri `tests/` altındadır. Biçimlendirme için `npm run format` çalıştırın. Çalışma zamanı bağımlılığı eklemeden önce gerekliliğini açıklayın. Müşteri mağazasından alınan kodu, ekran görüntülerini ve kişisel bilgileri izinsiz paylaşmayın.

Hata düzeltmesi, hatayı tekrar üreten ve sonucu doğrulayan bir test içermelidir. Sipariş/sepet değişikliklerini test mağazasında doğrulayın. Değişikliği küçük bir PR ile sunun; beklenen davranışı, test sonucunu ve uyumluluk etkisini yazın. Güvenlik açıkları için SECURITY.md yolunu izleyin.

Dağıtım ZIP'i `npm run build` ile güncel kaynaklardan `dist/` içinde üretilir. Oluşan ZIP'i kaynak olarak commit etmeyin. Sürüm yayınlamadan önce package.json, kilit dosyası ve CHANGELOG'u eşitleyin; doğrulanan commit'i etiketleyip bu commit'ten üretilen ZIP'i release'e ekleyin. CI artifact'i yayımlanmış kararlı sürüm anlamına gelmez.
