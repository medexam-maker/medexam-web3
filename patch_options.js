const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const strOptions = opts\.map\(\(o:any\) => typeof o === 'string' \? o : \(o\.text_en \|\| o\.text_ar \|\| ''\)\);/g, `const strOptions = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text_ar || ''));
        const optionsEn = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text || ''));
        const optionsAr = opts.map((o:any) => typeof o === 'string' ? o : (o.text_ar || o.text || ''));`);

code = code.replace(/const strOptions = opts\.map\(\(o:any\) => typeof o === 'string' \? o : \(o\.text \|\| o\.text_en \|\| o\.text_ar \|\| ''\)\);/g, `const strOptions = opts.map((o:any) => typeof o === 'string' ? o : (o.text || o.text_en || o.text_ar || ''));
        const optionsEn = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text || ''));
        const optionsAr = opts.map((o:any) => typeof o === 'string' ? o : (o.text_ar || o.text || ''));`);

code = code.replace(/options: strOptions,/g, `options: strOptions,
          optionsEn,
          optionsAr,`);

fs.writeFileSync('server.ts', code);
