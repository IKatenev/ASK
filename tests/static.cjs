const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../dist');
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files = walk(root);
assert(files.length>10);
for(const file of files){assert(!/\.(php|env|pem|key)$/i.test(file), 'Private/server file: '+file);assert(!/[\x00-\x08]/.test(file));}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 const url=match[1]; if(/^(?:https?:|mailto:|tel:|data:)/.test(url))continue;
 assert(!url.startsWith('/'),'Absolute asset path breaks project Pages: '+url);
 assert(fs.existsSync(path.join(root,url.split('#')[0])),'Missing asset: '+url);
}
assert(!html.includes('telegram.php'));
assert(!html.includes('fonts.googleapis.com'));
assert(!html.includes('fancybox'));
assert(!/<script[^>]+src="[^\"]*imask/.test(html),'Mask must be loaded on demand');
assert(html.includes('Content-Security-Policy'));
assert(html.includes('rel="canonical"'));
assert(html.includes('application/ld+json'));
assert(html.includes('og:image'));
assert(html.includes('mailto:info@luch-kino.ru'));
assert(html.includes('data-video'));
assert.equal((html.match(/<h1>/g)||[]).length,1);
assert(!html.includes('Заявка отправлена'));
assert(fs.existsSync(path.join(root,'.nojekyll')));
assert(!files.some(f=>f.includes('node_modules')));
assert(!files.some(f=>fs.readFileSync(f).includes(Buffer.from('TELEGRAM_BOT_TOKEN'))));
console.log('PASS: static artifact, safe file allowlist, relative assets, metadata, CSP and truthful contact flow');

assert(html.indexOf('document.documentElement.classList.add("js")') < html.indexOf('rel="stylesheet"'), 'JS mode must be set before first style/layout');
const crypto = require('node:crypto');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
 if (/\bsrc\s*=/.test(match[0].slice(0, match[0].indexOf('>')))) continue;
 const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
 assert(html.includes("'sha256-" + hash + "'"), 'Inline script missing CSP authorization');
}
