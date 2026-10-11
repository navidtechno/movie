# MovieBox Stremio Addon

ادان غیررسمی Stremio که کاتالوگ فیلم و سریال MovieBox رو داخل Nuvio / Stremio میاره.

## این چی کار می‌کنه؟

- **کاتالوگ فیلم و سریال** + جستجو (داخل Nuvio روی آیکن ذره‌بین)
- **صفحه جزئیات** هر عنوان با پوستر، خلاصه، امتیاز IMDb و لیست قسمت‌ها
- **پخش مستقیم** — بهترین کیفیت (تا 1080p) به صورت m3u8/MP4 + زیرنویس

اطلاعات از بک‌اند رسمی MovieBox (`api3–api8.aoneroom.com`) با امضای HMAC-MD5 گرفته می‌شه.

## ⚠️ نکته مهم: تحریم منطقه‌ای

سرور MovieBox آی‌پی ایران رو بلاک می‌کنه (خطای `Service not available in current region`).
پس **این ادان باید روی یه سرور خارج از ایران اجرا بشه** (مثلاً یه VPS ارزان در اروپا).
خودِ Nuvio روی گوشی/تلویزیون شما فقط به سرور ادان وصل می‌شه، پس از ایران هم کار می‌کنه.

## اجرا

### روش ۱: Docker (پیشنهادی)

```bash
docker build -t moviebox-stremio .
docker run -d -p 7000:7000 --restart unless-stopped moviebox-stremio
```

### روش ۲: مستقیم با Node.js (نسخه ۱۸ به بالا)

```bash
npm install
PORT=7000 node server.js
```

بعد آدرس manifest رو توی Nuvio اضافه کن:

```
http://<ip-or-domain-of-your-server>:7000/manifest.json
```

مسیرها: `Nuvio → Addons → Add Addon → Paste manifest URL`

## تست

```bash
node test.js   # تست آفلاین با داده نمونه (بدون نیاز به اینترنت)
```

## ساختار

```
server.js        # اجرای سرور HTTP
src/
  sign.js        # امضای HMAC-MD5 درخواست‌ها (مهندسی معکوس از APK)
  moviebox.js    # کلاینت API مووی‌باکس (جستجو، جزئیات، فصل، استریم، زیرنویس)
  addon.js       # تعریف ادان Stremio (catalog / meta / stream)
```

## محدودیت‌های شناخته‌شده

- کیفیت‌ها تا 1080p (هر چی خود MovieBox بده)
- بعضی استریم‌ها ممکنه کوکی امضاشده CloudFront بخوان؛ اگه پخش نشد بگو تا پراکسی اضافه کنم
- برای اکانت VIP لازم نیست؛ محتوای رایگان رو پوشش می‌ده
