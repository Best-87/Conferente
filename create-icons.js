// create-icons.js
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function createIcons() {
  console.log('🎨 Generando iconos para PWA...');
  
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
      ctx.fillRect(0, 0, size, size);
      
      // Logo de balanza (más simple)
      ctx.fillStyle = 'white';
      
      // Base
      ctx.fillRect(size * 0.25, size * 0.7, size * 0.5, size * 0.05);
      
      // Poste
      ctx.fillRect(size * 0.48, size * 0.3, size * 0.04, size * 0.4);
      
      // Plato izquierdo
      ctx.beginPath();
      ctx.arc(size * 0.35, size * 0.4, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Plato derecho
      ctx.beginPath();
      ctx.arc(size * 0.65, size * 0.4, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Guardar como PNG
      const buffer = canvas.toBuffer('image/png');
      const filename = `icon-${size}x${size}.png`;
      fs.writeFileSync(path.join(iconsDir, filename), buffer);
      
      console.log(`✅ Icono creado: ${filename}`);
    }
    
    console.log('🎉 Todos los iconos generados!');
    console.log('📁 Ubicación: ' + iconsDir);
    
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

if (require.main === module) {
  createIcons();
}

module.exports = { createIcons };