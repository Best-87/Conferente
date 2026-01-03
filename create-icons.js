// create-icons.js
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

async function createIcons() {
  console.log('🎨 Generando iconos para APK...');
  
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  try {
    for (const size of iconSizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fondo azul
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.2);
      ctx.fill();
      
      // Logo de balanza
      ctx.fillStyle = 'white';
      ctx.save();
      
      // Escalar según tamaño
      const scale = size / 512;
      ctx.scale(scale, scale);
      
      // Base de la balanza
      ctx.beginPath();
      ctx.roundRect(128, 384, 256, 51, 25);
      ctx.fill();
      
      // Poste
      ctx.fillRect(253, 154, 6, 230);
      
      // Plato izquierdo
      ctx.beginPath();
      ctx.ellipse(179, 205, 77, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Plato derecho
      ctx.beginPath();
      ctx.ellipse(333, 205, 77, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Guardar como PNG
      const buffer = canvas.toBuffer('image/png');
      const filename = `icon-${size}x${size}.png`;
      fs.writeFileSync(path.join(iconsDir, filename), buffer);
      
      console.log(`✅ Icono creado: ${filename}`);
    }
    
    console.log('🎉 Todos los iconos generados correctamente!');
    console.log('📁 Ubicación: ' + iconsDir);
    
    // Crear README
    const readme = `# Iconos para APK

## Archivos generados:
${iconSizes.map(size => `- icon-${size}x${size}.png`).join('\n')}

## Cómo usar:
1. Sube estos archivos a tu servidor en la carpeta /icons
2. Actualiza el manifest.json con las rutas correctas
3. Usa PWABuilder.com para crear el APK

## Instrucciones para PWABuilder:
1. Visita https://www.pwabuilder.com
2. Ingresa la URL de tu app
3. Haz clic en "Package for stores"
4. Selecciona Android y sigue las instrucciones
5. Descarga el APK generado
    `;
    
    fs.writeFileSync(path.join(iconsDir, 'README.txt'), readme);
    console.log('📝 README creado en la carpeta de iconos');
    
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

if (require.main === module) {
  createIcons();
}

module.exports = { createIcons };