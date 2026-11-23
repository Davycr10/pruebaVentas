# Cómo construir la APK de Inventario Interno

La aplicación es una app web (React) que se empaqueta en una APK con **Capacitor**. Los requisitos:

- **JDK 17 o superior** (Android Studio lo incluye, o descarga Temurin: https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk)
- **Android SDK** (solo se necesita una vez)
- 30-60 minutos

## 1. Preparar el Android SDK (una sola vez)

1. Descarga las herramientas de línea de comandos de Android:
   https://dl.google.com/android/repository/commandlinetools-win-13160883_latest.zip
   (o busca "Command line tools only" en https://developer.android.com/studio/index.html)
2. Descomprime el zip en una carpeta, p. ej. `C:\Android\sdk`.
   - Después de descomprimirlo debes tener: `C:\Android\sdk\cmdline-tools\bin\sdkmanager`.
   - Si el zip te crea una carpeta `commandlinetools` huérfana, muévela para que tenga el nombre `cmdline-tools`.
3. Prepara el entorno (en una ventana de PowerShell nueva o añádelo al PATH de Windows):
   ```powershell
   $env:ANDROID_HOME = "C:\Android\sdk"
   $env:JAVA_HOME = "C:\Program Files\Android\jdk\jdk-8.0.302.8-hotspot\jdk8u302-b08"  # o tu JDK 17
   $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
   ```
   (Usa tu JDK 17 en lugar del de Android 8 si lo instalaste antes.)
4. Instala los paquetes del SDK necesarios:
   ```powershell
   .\cmdline-tools\bin\sdkmanager --sdk_root=C:\Android\sdk "platforms;android-35" "build-tools;35.0.2" "platform-tools"
   .\cmdline-tools\bin\sdkmanager --sdk_root=C:\Android\sdk --licenses   # acepta las licencias (pulsa 'y')
   ```
   - Plataforma sugerida: `android-35` (si no existe, sdkmanager te mostrará las disponibles; usa la última).
5. Verifica:
   ```powershell
   .\cmdline-tools\bin\sdkmanager --list | Select-Object -First 20
   ```

## 2. Instalar Capacitor en el proyecto

1. Dentro de la carpeta `frontend`:
   ```powershell
   cd frontend
   npm install -D @capacitor/cli @capacitor/android
   ```
2. Crea o edita `capacitor.config.json` en `frontend` (junto a package.json):
   ```json
   {
     "appId": "com.inventario.interno",
     "appName": "Inventario Interno",
     "webDir": "dist",
     "server": {
       "url": "http://<TU_IP_LAN>:3000",
       "cleartext": true
     }
   }
   ```
   - Reemplaza `<TU_IP_LAN>` por la dirección IP local de tu PC (puedes verla en `ipconfig` o en Ajustes > Red e Internet > Propiedades > IPv4).
   - El teléfono debe poder llegar a la PC por la red local (mismo Wi-Fi).
   - Nota: `appId` debe ser un nombre de dominio inverso válido (ej. `com.inventario.interno` o `com.ejemplo.inventario`).
3. Prepara el proyecto Android:
   ```powershell
   npx cap add android   # crea la carpeta android/
   npx cap sync          # sincroniza la app y la API con el proyecto Android
   npx cap build android # construye la APK
   ```
   - La primera vez, Gradle se descargará y configurará automáticamente (tarda unos minutos).
4. La APK queda en:
   `android\app\build\outputs\apk\debug\app-debug.apk`

## 3. Entregar la APK al teléfono

1. Copia la APK a la carpeta de la web app:
   ```powershell
   copy "android\app\build\outputs\apk\debug\app-debug.apk" frontend\dist\app.apk
   ```
2. Reaparece la APK para actualizaciones: reinicia el servidor de producción:
   ```powershell
   # dentro de la carpeta frontend
   # (o ejecuta de nuevo: node server.cjs --port 3000)
   ```
3. En el teléfono:
   - Transfiere `InventarioInterno.apk` (o `app-debug.apk`) al teléfono (por Bluetooth, cable o menú compartir).
   - Antes de instalar: ve a Ajustes > Seguridad (o Privacidad) > "Instalar aplicaciones desconocidas" → permítelo para tu explorador de archivos o para la app que lo instalará.
   - Abre el APK con un explorador de archivos > Instalar.

## 4. Actualizar la APK (cuando yo haga cambios)

1. YO cambio el código (en `frontend/` o `backend/`).
2. Bump la versión: abre `frontend/package.json` y cambia `"version"` (ej. `1.0.0` → `1.1.0`).
3. Rebuild la app web y reinicia el servidor de producción:
   ```powershell
   cd frontend
   npm run build
   node server.cjs --port 3000
   ```
4. Construye la APK nueva:
   ```powershell
   npx cap build android
   copy "android\app\build\outputs\apk\debug\app-debug.apk" frontend\dist\app.apk
   ```
5. En el teléfono: abre la app (o pulsa "Descargar e instalar APK" desde el banner de actualización que aparece cuando la versión cambia) y elige la APK nueva.

## Notas

- El servidor de producción (`node server.cjs --port 3000`) sirve:
  - la app estática (`/`),
  - el proxy de la API (`/api/*` → la API FastAPI en `http://127.0.0.1:8000`),
  - `GET /app/version` → `{ version: "x.y.z" }` (la versión actual, se lee de package.json),
  - `GET /app.apk` → el APK si existe en `frontend/dist/app.apk`.
- La APK es una "debug" de desarrollo; para una APK de producción pides comprimir imágenes, ofuscar el código (ProGuard) y firmarla digitalmente con un keystore.
- Si el teléfono no puede llegar a `http://192.168.1.15:3000` (IP de tu PC), verifica que la PC y el teléfono estén en la misma red y que el firewall de Windows permita conexiones entrantes en el puerto 3000 (redes privadas).
