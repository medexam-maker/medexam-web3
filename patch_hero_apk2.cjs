const fs = require('fs');
let code = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');

const downloadButton = `
          {latestApk && (
            <div className="pt-4 flex justify-center animate-fade-in">
              <a
                href={latestApk.download_url}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                <span>تحميل التطبيق للأندرويد (v{latestApk.version})</span>
              </a>
            </div>
          )}
`;

code = code.replace(
  '<SearchComponent />\n          </div>',
  `<SearchComponent />\n          </div>\n${downloadButton}`
);

if (!code.includes('Download')) {
  code = code.replace('ArrowLeft,', 'ArrowLeft, Download,');
  // or
  code = code.replace('Search\n}', 'Search,\n  Download\n}');
}

fs.writeFileSync('src/components/HeroSection.tsx', code);
console.log('Patched HeroSection successfully');
