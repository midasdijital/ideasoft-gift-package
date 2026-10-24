# Mağazaya özel sepet entegrasyonu

Bu belge bir IdeaSoft API uç noktası tanımlamaz. Tema/sürüm için doğrulanmış sepet kodunu bu sözleşmeye bağlayın. `button.click()` veya sabit bekleme süresi bir başarı kanıtı değildir.

## Sözleşme

Modül yüklenmeden önce `window.MidasGiftCartAdapter` tanımlanır:

```ts
interface CartAdapter {
  addMain(input: {
    button: HTMLElement;
    customization: null | {
      groupId: string;
      fields: Array<{ fieldId: string; value: string }>;
    };
  }): Promise<{ success: true }>;
  addGift(input: {
    productId: string;
    quantity: 1;
  }): Promise<{ success: true }>;
}
```

`addMain` butonun temsil ettiği ana ürünü seçili varyantı, adedi ve mevcut diğer özelleştirmeleri koruyarak ekler. Kendisine verilen hediye özelleştirmelerini **ana ürünün** doğru grup/alan yapısına bir kez dönüştürüp göndermelidir. Tarayıcıdaki başka alanları topluca kapatmamalıdır. Modül bu işi entegrasyon adına yapmaz.

`addGift` yalnızca belirtilen paket ürününü bir adet ekler. Ana ürünün özelleştirmesini veya varyantını kopyalamamalıdır. Her yöntem sunucunun iş sonucunu doğruladıktan sonra `{ success: true }` döndürmelidir. Yalnızca HTTP 200 almak yeterli değildir; doğrulama, stok ve varyant hataları da ele alınmalıdır. Hata/başarısızlıkta reject edin veya `{ success: false }` döndürün. `undefined`, Promise olmadan erken dönüş veya koşulsuz başarı dönüşü desteklenmez.

Bir entegrasyon testinde şu iskelet kullanılabilir; **gerçek sepet eklemez**, canlı mağazaya yüklemeyin:

```javascript
window.MidasGiftCartAdapter = {
  async addMain({ button, customization }) {
    // Burada doğrulanmış tema isteğini çalıştırın ve iş sonucunu kontrol edin.
    // button ile seçili varyant/adet bağlamını, customization ile hediye alanlarını alın.
    throw new Error('Mağazanın addMain entegrasyonu henüz uygulanmadı');
  },
  async addGift({ productId, quantity }) {
    // Burada yalnızca paket ürününü ekleyen doğrulanmış isteği çalıştırın.
    throw new Error('Mağazanın addGift entegrasyonu henüz uygulanmadı');
  },
};
```

Dinleyici yalnızca aynı `data-product-id` değerli modül/buton çiftine uygulanır. Hediye kapalıysa normal tema akışına müdahale edilmez. DOM'a sonradan yeni modül eklerseniz `document.dispatchEvent(new Event('midas:gift:refresh'))` çağırın. Adapter sayfa başında hazır olmalıdır; yapılandırmayı sonradan değiştirmek için sayfayı yenileyin.

## Başarı, hata ve tekrar deneme

Ana ürün doğrulanmadan paket eklenmez. İşlem sürerken aynı modülden ikinci tıklama engellenir. Başarıda kullanıcıya iki eklemenin doğrulandığı bildirilir.

Ana ürün başarılı, paket başarısızsa otomatik tekrar deneme veya ana ürünü silme yapılmaz; bu modül sayfa yenilenene kadar tekrar ana ürün eklemeyi engeller ve sepetin kontrol edilmesini ister. Ağ hatası, işlemin sunucuda gerçekleşmediğini kanıtlamaz. Kullanıcıya yeniden denemeden önce sepet kontrolü önerilir. Sayfayı yenilemek kilidi kaldırır; yenilemeden önce sepet mutlaka kontrol edilmelidir.

Bu iki istek bir veritabanı işlemi değildir. Sunucu destekliyorsa idempotency ve satır ilişkilendirmesi ekleyin. Modül sepet satırı silme, geri alma, ödeme tamamlama veya teslimat garantisi sağlamaz. Entegrasyon Promise'ı sonlanmazsa modül beklemede kalır; adapter ağ zaman aşımını ve belirsiz sonuçları yönetmelidir. Otomatik timeout/yeniden gönderim çift ücretlendirmeye yol açabileceği için modül bunu tahmin etmez.

Sunucu ID, fiyat, stok, uzunluk, alan/grup ataması, varyant ve yetkiyi bağımsız doğrulamalıdır. DOM'daki ürün ID'si bir güvenlik sınırı değildir. İsteklerde mevcut IdeaSoft oturum ve CSRF mekanizmasını koruyun; gizli anahtarları tarayıcıya taşımayın.
