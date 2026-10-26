export const LANGUAGE_STORAGE_KEY='cuu-an-language-v1';
export function gameLanguage(){return globalThis.document?.documentElement?.lang==='en'?'en':'vi';}
export function setupLanguageSelector(){
 const label=document.createElement('label');label.className='journey-language';label.innerHTML='<span>Ngôn ngữ / Language</span><select id="gameLanguage" aria-label="Ngôn ngữ / Language"><option value="vi">Tiếng Việt</option><option value="en">English</option></select>';
 const select=label.querySelector('select');select.value=gameLanguage();select.onchange=()=>{const language=select.value;if(!['vi','en'].includes(language))return;try{localStorage.setItem(LANGUAGE_STORAGE_KEY,language);}catch{}const target=new URL(language==='en'?'index.en.html':'index.html',location.href);target.search=location.search;target.searchParams.delete('lang');location.replace(target.href);};
 document.querySelector('.journey-intro .journey-version').before(label);
}
