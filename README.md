# IdeaSoft Hediye Paketi Bileşeni

[![Doğrulama](https://github.com/midasdijital/ideasoft-gift-package/actions/workflows/ci.yml/badge.svg)](https://github.com/midasdijital/ideasoft-gift-package/actions/workflows/ci.yml)

IdeaSoft ürün detay sayfalarına ücretli standart ve premium hediye paketi seçenekleri eklemek için geliştirilen tema bileşeni.

**Midas Dijital**, e-ticaret danışmanlığı ve mağaza geliştirme hizmetleri sunan bir ajanstır. Bu proje ajansın tema entegrasyonları için geliştirdiği açık kaynak bir bileşendir; IdeaSoft'un resmî ürünü değildir.

> **2.0.0-rc.1 ön sürümü:** 1.x'teki sabit süreyle paket ekleme kaldırıldı. Hediye özelliği gerçek sepet sonucunu döndüren bir mağaza entegrasyonu kurulana kadar devre dışıdır. Bu sürüm ön sürümdür; gerçek mağaza doğrulaması tamamlanmadan kararlı kabul edilmez.

## Özellikler

- Standart/premium paket ve ürün bazlı seçenekler.
- Ana ürün başarısı doğrulandıktan sonra tek paket ekleme.
- Çift tıklama koruması ve kısmi başarıda tekrar ürün eklemeyi engelleme.
- Erişilebilir alanlar, durum mesajları ve mobil uyumlu CSS.
- Harici çalışma zamanı kütüphanesi, CDN, izleme veya API anahtarı gerektirmez.
- Ayrı CSS/JavaScript dosyaları; inline script gerektirmez.

## Gereksinimler ve uyumluluk

IdeaSoft tema dosyalarına ve sepet entegrasyon koduna erişim gerekir. Satışa açık, stoğu uygun bir paket ürünü oluşturulmalıdır. Aynı ürün için sayfada yalnızca bir modül kullanın. `ideasoft-gift-package` ile `ideasoft-gift-delivery-module` alternatif ürünlerdir; ikisini birlikte yüklemeyin.

Desteklenen buton işaretlemesi:

```html
<button
  type="button"
  data-selector="add-to-cart"
  data-context="detail"
  data-product-id="42"
>
  Sepete ekle
</button>
```

`.add-to-cart-button` sınıfı zorunlu değildir. Form submit, hızlı alışveriş, SPA geçişleri veya farklı buton yapıları ek tema entegrasyonu gerektirir. Dinleyici, hediye açıkken tıklamayı yakalar ve varsayılan tema işleyicisini durdurur; daha önce çalışan bir capture işleyicisiyle birlikte çift istek oluşmadığını test mağazasında doğrulayın. Genel IdeaSoft sürüm uyumluluğu veya canlı sipariş doğrulaması iddia edilmez.

## Kurulum

1. [Repoyu](https://github.com/midasdijital/ideasoft-gift-package) klonlayın veya doğrulanmış sürümün ZIP'ini açın. `src/` asıl kaynaktır; `dist/` üretilir.
2. `src/gift-package.twig` dosyasını temanın `html/snippets/product/` klasörüne yükleyin.
3. `src/gift-package.css` ve `src/gift-package.js` dosyalarını temanızın statik dosya alanına yükleyin. Aşağıdaki `/assets/` yolu örnektir; gerçek URL'lerin 200 döndüğünü kontrol edin.
4. Ürün detay şablonunda `.product-cart-buttons` bloğunun hemen üstüne ekleyin:

```twig
{% include 'html/snippets/product/gift-package.twig' %}
```

5. Tema yerleşiminde CSS'i bir kez, mağazaya özel entegrasyonu ve ardından modül JavaScript'ini yükleyin:

```html
<link rel="stylesheet" href="/assets/gift-package.css" />
<script src="/assets/midas-cart-adapter.local.js" defer></script>
<script src="/assets/gift-package.js" defer></script>
```

6. Twig başındaki paket ürün ID'lerini `0` yerine mağazanızdaki gerçek pozitif ID'lerle değiştirin. Başlık, açıklama ve fiyat metinlerini düzenleyin. `standardGiftOption` / `premiumGiftOption` ile seçenekleri, `giftModule` ile tüm modülü `on` / `off` yapabilirsiniz.
7. [Sepet entegrasyonu sözleşmesini](docs/cart-integration.md) uygulayın ve [mağaza kabul kontrollerini](docs/store-checklist.md) tamamlayın. Tema önbelleğini temizleyin.

Ürün ID'si veya entegrasyon yoksa hediye seçimi kapalı kalır; ana ürün normal tema akışıyla eklenebilir. CSS rengini kendi dosyanızda `.md-gift { --md-accent: #9f1239; }` ile özelleştirebilirsiniz. Metinler HTML olarak çalıştırılmaz.

`standardGiftUrl` / `premiumGiftUrl` ile ürün bağlantılarını, `standardGiftImage` / `premiumGiftImage` ile görselleri ekleyebilirsiniz. Boş veya güvenli HTTP(S) URL olmayan değerler gösterilmez. HTTPS mağazada HTTP hedefleri reddedilir. Uzak görseller ziyaretçinin IP adresini görebilir; aynı mağazada barındırılması önerilir.

Gösterilen fiyat yalnızca bilgilendirme metnidir; gerçek fiyatı, stoğu, varyantı ve yetkileri IdeaSoft sunucusu belirler. Bir ana ürün ekleme işlemi için bir paket eklenir; ana ürün adedi otomatik olarak pakete kopyalanmaz. Paket ve ana ürün ayrı sepet satırlarıdır, atomik bir işlem veya otomatik silme bağlantısı yoktur.

## 1.x'ten geçiş

Eski snippet, JavaScript ve gizli paket butonunu kaldırın. Yeni dosyaları birlikte yükleyin; eski ZIP'i yeni kaynaklarla karıştırmayın. 1.x'teki gecikmeye dayalı otomatik ekleme veya yerleşik özelleştirme alanlarını değiştirme davranışı korunmaz. Bu değişiklik mağazaya özel sepet entegrasyonu gerektirir. Yeni sürümü doğrudan canlı temanın üstüne yazmayın; test teması üzerinde doğrulayıp geçiş yapın. Eski sürüme dönüş, eski hata davranışlarını da geri getirir.

## Sürümü indirme

[v2.0.0-rc.1 ön sürümü](https://github.com/midasdijital/ideasoft-gift-package/releases/tag/v2.0.0-rc.1) sayfasından kurulum ZIP'ini ve `SHA256SUMS.txt` dosyasını indirin. `Source code` arşivleri GitHub'ın otomatik kaynak kopyalarıdır; kuruluma yönelik paket sürüm adını taşıyan ZIP'tir. Kurulumdan önce README geçiş adımlarını izleyin.

## Geliştirme ve dağıtım

Node.js yalnızca geliştirme içindir; mağazada Node.js çalışmaz. Node 24.15+ kullanın.

```sh
git clone https://github.com/midasdijital/ideasoft-gift-package.git
cd ideasoft-gift-package
npm ci --ignore-scripts
npm run validate
```

`validate`: JavaScript sözdizimi, Twig çıktı kaçış kontrolleri, biçimlendirme, gerçek şablonları render eden DOM testleri ve ZIP üretimi. Twig.js testleri IdeaSoft'un sunucu Twig sürümünde yapılan bir testin yerine geçmez. CI ayrıca geliştirme bağımlılıkları için `npm audit` çalıştırır. Tarayıcıya gönderilen kodun çalışma zamanı npm bağımlılığı yoktur.

`npm run build`, yalnızca kaynak ve belgeleri içeren `dist/ideasoft-gift-package-v2.0.0-rc.1.zip` üretir. Bu ZIP ön sürüm paketidir; kararlı yayın ayrıca yapılır. ZIP üretimi aynı kaynakta aynı baytları verir. Test mağazası kontrolü henüz otomatikleştirilmemiştir.

```text
src/       Twig, JavaScript ve CSS
docs/      Sepet sözleşmesi ve mağaza kabul kontrolleri
tests/     Şablon ve davranış regresyon testleri
scripts/   Kontrol ve dağıtım araçları
```

## Güvenlik, katkı ve lisans

[Güvenlik politikası](SECURITY.md) · [Katkı rehberi](CONTRIBUTING.md) · [Değişiklik günlüğü](CHANGELOG.md) · [MIT lisansı](LICENSE)

Müşteri ayarlarını, sipariş bilgilerini veya erişim anahtarlarını repoya eklemeyin. Açık kaynak bileşen herhangi bir hizmet seviyesi veya tüm temalarda çalışma garantisi içermez.
