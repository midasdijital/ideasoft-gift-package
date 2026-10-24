# Mağaza kabul kontrolleri

Bu kontroller gerçek test mağazasında yürütülmelidir. Otomatik DOM testleri bunların tamamlandığını göstermez.

- Tema yedeği alın; yeni kodu test temasına yükleyin. Eski modül ve gizli buton kalmadığını doğrulayın.
- Gerçek paket ID'leri, sunucu fiyatları ve stoklarıyla standart/premium seçimlerini deneyin.
- Hediye kapalıyken ana ürünün normal akışı değişmemeli; entegrasyon eksikken hediye seçilememeli.
- Varyant seçilmemiş, stok bitmiş ve sunucu hatası durumlarında paket eklenmemeli.
- Yavaş ağ ve çift tıklamada ana ürün/paket birer kez eklenmeli. Capture işleyicileri çift istek oluşturmamalı.
- Ana ürün başarılı/paket başarısız durumunda mesajı ve yeniden ana ürün eklememe davranışını doğrulayın. Yenilemeden önce sepeti kontrol edin.
- Not/tarih kullanılıyorsa ana ürünün sepet ve sipariş satırında tam bir kez görünmeli; diğer özelleştirmeler korunmalı. Hediye kapatılınca vazgeçilen değerler gönderilmemeli.
- Adet ve varyant korunmalı; her ekleme için bir paket davranışı mağaza beklentisiyle uyuşmalı.
- Tab, Shift+Tab, Space ve Enter ile kullanımı; durum mesajlarının okunmasını kontrol edin.
- 320 px mobil, tablet ve masaüstünde taşma, alt menü ve sepete ekleme görünürlüğünü kontrol edin.
- Tarayıcı konsolunda hata, eksik asset ve CSP ihlali olmamalı. Sipariş örneklerinde kişisel veri paylaşmayın.

Kontrol sonucu, tarih, kullanılan tema/sürüm ve doğrulanan commit mağazaya özel kayıt altında tutulmalıdır.
