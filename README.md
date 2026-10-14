# Amix — Android через Capacitor

Веб-приложение Amix (папка `www/`) упаковывается в Android-приложение (WebView).

## Структура

```
amix-capacitor/
├── www/                      веб-часть (index.html, bootstrap-native.js, sw.js, manifest.json, иконки)
├── android-overrides/        файлы 5–9 из PASTED + иконки; кладутся в android/ скриптом
│   ├── build.gradle
│   └── app/
│       ├── build.gradle
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/com/amix/app/MainActivity.kt
│           └── res/ (xml/network_security_config.xml, иконки mipmap-*, цвет фона иконки)
├── scripts/apply-android.mjs раскладывает android-overrides/ по android/
├── capacitor.config.ts       (webDir = www)
├── package.json
└── .github/workflows/android.yml   сборка APK на GitHub без Android Studio
```

Папки `android/` в архиве нет: её создаёт команда `npx cap add android`.

## Вариант A. Сборка на GitHub (без Android Studio)

1. Создайте репозиторий и загрузите в него всё содержимое этой папки (включая `.github`).
2. Откройте вкладку **Actions** → **Build Android APK (Capacitor)** → **Run workflow**.
3. Через 5–10 минут скачайте артефакт **Amix-debug-apk** → внутри `app-debug.apk`.
4. Перешлите APK на телефон и установите (разрешите установку из неизвестных источников).

## Вариант B. Локально (нужны Node 18+, JDK 17, Android Studio)

```bash
npm install
npm run android:setup      # cap add android + apply-android.mjs + cap sync
npm run cap:open           # откроется Android Studio → Run ▶
```

После любых правок в `www/` выполните `npx cap sync android`.

## Как поменять приложение

- Меняете `www/index.html` → `npx cap sync android` → пересобираете.
- Иконки Android лежат в `android-overrides/app/src/main/res/mipmap-*`.
- Если папку `android/` закоммитить, workflow не будет создавать её заново, но
  `apply-android.mjs` всё равно запустится (он безопасен при повторном запуске).

## ВАЖНО: что нужно проверить на телефоне

1. **WebGPU в WebView.** ИИ работает через WebLLM, а ему нужен WebGPU. Подтверждения, что
   Android System WebView включает его по умолчанию, я не нашёл. Если на телефоне в чате
   появилось сообщение про WebGPU, значит WebView его не даёт. Тогда варианты:
   нативное приложение на Kotlin + MediaPipe (проект `amix-android`) или TWA (запуск через Chrome).
2. **Вход через Google.** В `index.html` используется `signInWithPopup`. В WebView всплывающие
   окна не работают, а Google блокирует вход во встроенных WebView (ошибка `disallowed_useragent`).
   Для приложения нужен нативный вход (плагин `@capacitor-firebase/authentication` и файл
   `google-services.json`). Telegram-вход через виджет тоже придётся проверить отдельно.
3. **Голос.** В манифест добавлено разрешение `RECORD_AUDIO`; вкладку «Голосовой ИИ» проверьте на устройстве.
4. **Для RuStore и Google Play** нужна подписанная release-сборка, а не debug:
   создайте ключ (`keytool -genkey -v -keystore amix.jks -alias amix -keyalg RSA -keysize 2048 -validity 10000`),
   сохраните его и пароль в надёжном месте и соберите `./gradlew assembleRelease` или `bundleRelease`
   с подписью. Ключ нельзя терять и нельзя класть в репозиторий.

## Отличия от PASTED (и почему)

- `webDir: 'www'` вместо `'.'`: иначе Capacitor копирует в приложение `node_modules` и саму папку `android/`.
- Убран `bundledWebRuntime`: в Capacitor 6 этой опции уже нет.
- В `package.json` добавлены `typescript` (нужен CLI для чтения `capacitor.config.ts`) и несколько удобных скриптов.
- В `index.html` service worker не регистрируется внутри приложения (файлы и так лежат в APK).
- Иконки Android сделаны из ваших `icon-512.png` и `icon-maskable-512.png`.
