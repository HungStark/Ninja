// The same four curved blades appear on the mobile button and shop cards.
export function shurikenIcon({tinted=false,className='tactical-shuriken',hole='#203c40'}={}){
  return `<svg class="${className}" viewBox="0 0 96 96" aria-hidden="true">
  ${tinted?'':'<defs><linearGradient id="tacticalShurikenGold" x2=".8" y2="1"><stop stop-color="#fff5c9"/><stop offset=".48" stop-color="#ecdfb1"/><stop offset="1" stop-color="#baa56e"/></linearGradient></defs>'}
  <path d="M79 7C65 21 63 33 67 39C77 42 85 53 89 72C74 63 62 63 56 67C52 77 42 85 23 89C32 74 32 62 28 56C17 52 9 42 6 23C21 32 33 32 39 28C43 17 57 10 79 7Z" fill="${tinted?'currentColor':'url(#tacticalShurikenGold)'}" stroke="${tinted?'#e4e9de':'#fff2c4'}" stroke-opacity=".45" stroke-width="1.2"/>
  <path d="M79 7L48 40L39 28C43 17 57 10 79 7ZM89 72L56 49L67 39C77 42 85 53 89 72ZM23 89L46 56L56 67C52 77 42 85 23 89ZM6 23L39 46L28 56C17 52 9 42 6 23Z" fill="${tinted?'#ffffff':'#fff1c3'}" opacity="${tinted?'.22':'.45'}"/>
  <circle cx="48" cy="48" r="10.5" fill="${hole}" stroke="${tinted?'currentColor':'#f7e7b4'}" stroke-width="2.5"/>
</svg>`;
}
