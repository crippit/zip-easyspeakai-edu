import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function templateManifestPlugin() {
  const generateManifest = () => {
    // Determine the directory of the current module
    const _dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;
    const templatesDir = path.resolve(_dirname, 'public/templates');
    if (!fs.existsSync(templatesDir)) return;

    const files = fs.readdirSync(templatesDir);
    const indexData = [];

    for (const file of files) {
      if (file === 'index.json' || !file.endsWith('.json')) continue;

      try {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);

        let gridData = json;
        let pageCount = 1;
        // Handle EasySpeak AAC exported format (which contains a 'pages' array of grids)
        if (json.pages && Array.isArray(json.pages) && json.pages.length > 0) {
           gridData = json.pages[0]; // Extract the main page of the export
           pageCount = json.pages.length;
        }

        if (gridData.id && gridData.label) {
          indexData.push({
            id: gridData.id,
            file: file,
            label: gridData.label,
            icon: gridData.icon || '📄',
            color: gridData.color || 'bg-blue-100',
            tileCount: gridData.tiles ? gridData.tiles.length : 0,
            pageCount: pageCount
          });
        }
      } catch (err) {
        console.error(`Error parsing template file ${file}:`, err);
      }
    }

    fs.writeFileSync(
      path.join(templatesDir, 'index.json'),
      JSON.stringify(indexData, null, 2)
    );
    console.log(`✅ Auto-generated templates index with ${indexData.length} templates.`);
  };

  return {
    name: 'generate-templates-manifest',
    buildStart() {
      generateManifest();
    },
    handleHotUpdate({ file }) {
      if (file.includes('public/templates') && file.endsWith('.json') && !file.endsWith('index.json')) {
        generateManifest();
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    templateManifestPlugin(),
  ],
})