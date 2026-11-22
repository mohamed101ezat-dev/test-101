/* بيجمّع ملفات src/js بالترتيب في js/app.js (الملف اللي بيشتغل على الموبايل).
   اكتب التعديلات في src/js، وبعدين: node build.js */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=path.join(__dirname,'src','js');
const files=fs.readdirSync(dir).filter(f=>/^\d\d-.*\.js$/.test(f)).sort();
const out=files.map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('');
fs.writeFileSync(path.join(__dirname,'js','app.js'),out);
console.log('js/app.js ←',files.length,'files ·',out.length,'chars · md5',crypto.createHash('md5').update(out).digest('hex').slice(0,10));
