// deploy.js
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando despliegue de Controle de Pesagem...\n');

// 1. Verificar estructura de archivos
console.log('1. Verificando estructura de archivos...');
const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'sw.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Archivo faltante: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Faltan archivos esenciales. Abortando despliegue.');
  process.exit(1);
}

console.log('✅ Todos los archivos necesarios están presentes\n');

// 2. Crear instrucciones para APK
console.log('2. Generando instrucciones para APK...');
const instructions = `# 🚀 INSTRUCCIONES PARA GENERAR APK

## 📱 Para crear el APK:

### Opción 1: PWABuilder (Recomendado)
1. Visita: https://www.pwabuilder.com
2. Ingresa la URL de tu aplicación
3. Haz clic en "Start" y luego en "Package for stores"
4. Selecciona "Android" y sigue las instrucciones
5. Descarga el APK generado

### Opción 2: Bubblewrap (Para desarrolladores)
1. Instala Node.js y Bubblewrap:
   \`\`\`bash
   npm install -g @bubblewrap/cli
   \`\`\`
   
2. Inicializa el proyecto:
   \`\`\`bash
   bubblewrap init --manifest=https://TU-URL-AQUI/manifest.json
   \`\`\`
   
3. Construye el APK:
   \`\`\`bash
   bubblewrap build
   \`\`\`

## 📋 Archivos incluídos:
- ✅ index.html (Página principal)
- ✅ style.css (Estilos)
- ✅ app.js (Lógica de la app)
- ✅ manifest.json (Configuración PWA)
- ✅ sw.js (Service Worker)
- ✅ icons/ (Iconos en múltiples tamaños)
- ✅ offline.html (Página offline)

## 🔧 Para desarrollo local:
1. Ejecuta: \`npm install\`
2. Ejecuta: \`npm run generate-icons\`
3. Ejecuta: \`npm start\`
4. Abre http://localhost:8080

## 📞 Soporte:
- Issues: https://github.com/best-87/Conferente/issues

---

**Nota:** Para publicar en Google Play Store necesitas una cuenta de desarrollador (US$ 25).
Para distribución interna, puedes instalar el APK directamente en los dispositivos.

📅 Generado el: ${new Date().toLocaleDateString()}
`;

fs.writeFileSync('INSTRUCCIONES-APK.txt', instructions);
console.log('✅ Instrucciones generadas en INSTRUCCIONES-APK.txt\n');

// 3. Mensaje final
console.log('🎉 ¡Proceso completado!');
console.log('\n📱 Tu aplicación está lista para convertirla en APK:');
console.log('📄 Instrucciones detalladas en: INSTRUCCIONES-APK.txt');
console.log('\n💡 Para probar localmente:');
console.log('1. Instala Node.js');
console.log('2. Ejecuta: npm install');
console.log('3. Ejecuta: npm run generate-icons');
console.log('4. Ejecuta: npm start');
console.log('5. Abre http://localhost:8080');
console.log('\n🚀 ¡Buena suerte con tu aplicación!');