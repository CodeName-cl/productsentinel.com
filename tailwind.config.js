/** Tailwind de las landings /black y /navidad. Recompilar tras cambiar clases:
 *  npx tailwindcss@3.4.17 -i assets/landing.src.css -o assets/landing.css --minify
 *  y subir el ?v= de landing.css en el HTML. */
const root = '.';
module.exports = {
  content: [root + '/black/index.html', root + '/navidad/index.html', root + '/assets/campaign.js', root + '/assets/chat-bar.js'],
  theme: { extend: {
    colors: { blue: { brand: '#003F91' }, sky: { brand: '#5DA9E9' }, mint: { brand: '#E5F4E3' }, plum: { brand: '#6D326D' },
      ink: { 900: '#0B1B2B', 700: '#3A4A5A', 400: '#8A99A8', 200: '#E3E8EE', 50: '#F6F8FA' } },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'monospace'] },
    boxShadow: { soft: '0 1px 2px rgba(11,27,43,.04), 0 8px 24px rgba(11,27,43,.06)', card: '0 1px 3px rgba(11,27,43,.06), 0 12px 40px rgba(11,27,43,.08)' },
  } },
};
