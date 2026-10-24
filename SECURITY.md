# Güvenlik politikası

Midas Dijital, e-ticaret danışmanlığı ve tema entegrasyonları geliştiren bir ajanstır. Bu repo mağaza sunucusu veya ödeme uygulaması değildir; istemci tarafındaki kontroller sunucu doğrulamasının yerini tutmaz.

## Desteklenen sürüm

Güvenlik düzeltmeleri `main` dalına uygulanır. 2.x geliştirme hattı güncel hattır; 1.x dağıtımlarına yeni güvenlik düzeltmesi taahhüt edilmez. Henüz yayınlanmamış değişiklikler için CHANGELOG'a bakın.

## Açık bildirme

Müşteri verisi veya istismar ayrıntılarını public issue içinde paylaşmayın. [GitHub özel güvenlik bildirimi](https://github.com/midasdijital/ideasoft-gift-package/security/advisories/new) etkinse bu kanalı kullanın. Etkin değilse ajansla mevcut özel iletişim kanalınızdan iletişime geçin. Bildirimde etkilenen sürümü, etkiyi ve hassas veri içermeyen tekrarlama adımlarını belirtin. Bir yanıt süresi garantisi verilmez.

## Entegrasyon sınırı

- API anahtarları, erişim tokenları ve yönetim paneli bilgileri tarayıcıya veya repoya konulmamalıdır.
- Mağaza fiyatı, stok, varyant, yetki ve özelleştirme doğrulamalarını sunucu yapmalıdır.
- Yerel müşteri ayarlarını `config.local.js` içinde tutun. Bu dosya Git ve dağıtım paketine alınmaz.
- Kaynak/release dosyalarını inceleyin ve güncellemeyi önce test mağazasında deneyin.
- `npm audit` geliştirme bağımlılıklarını denetler; uygulamanın güvenli olduğuna dair garanti değildir.

GitHub CodeQL iş akışı JavaScript için statik analiz çalıştırır; sonuçların GitHub Security ekranına yüklenmesi repo ayarlarının izinlerine bağlıdır. Geçmiş commit ve eski release içerikleri yeniden yazılmaz; eski dağıtımlar güncellenmiş sayılmaz.
