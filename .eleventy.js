// .eleventy.js adaptado para deploy seguro
const fs = require("node:fs");
const path = require("node:path");

module.exports = function eleventyConfigSetup(eleventyConfig) {

    // --- Passthrough de assets estáticos (COMBINADO Y AJUSTADO) ---
    // Reglas existentes (asumiendo que los archivos están en 'src/...')
    eleventyConfig.addPassthroughCopy({ "src/css": "css" });
    eleventyConfig.addPassthroughCopy({ "src/js": "js" });
    eleventyConfig.addPassthroughCopy({ "src/data": "data" });
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

    // Archivos sueltos/root
    eleventyConfig.addPassthroughCopy({ "src/sw.js": "sw.js" });
    eleventyConfig.addPassthroughCopy({ "src/ads.txt": "ads.txt" });

    // Reglas nuevas
    eleventyConfig.addPassthroughCopy("public");
    eleventyConfig.addPassthroughCopy({ "src/icons": "icons" });
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addPassthroughCopy({ "src/manifest.json": "manifest.json" });
    eleventyConfig.addPassthroughCopy("favicon.ico");





    // ===== FIX UTF-8 para Nunjucks =====
    eleventyConfig.setNunjucksEnvironmentOptions({
        autoescape: false,
        throwOnUndefined: true
    });

    eleventyConfig.addFilter("safe", function (value) {
        return value;
    });

    // ===== Añadir timestamp para Cache Busting (NUEVO) =====
    eleventyConfig.addGlobalData("timestamp", () => {
        return Date.now();
    });

    // Date filter for sitemap
    eleventyConfig.addFilter("toISOString", (dateObj) => {
        return new Date(dateObj).toISOString();
    });

    // ===== Opcional: limpieza de archivos antiguos en build temporal =====
    eleventyConfig.on("beforeBuild", () => {
        const tmpDir = "_site";
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
            console.log(`🧹 ${tmpDir} eliminado antes del build.`);
        }
    });

    return {
        // --- Directorios ---
        dir: {
            input: "src",          // raíz del proyecto (Source)
            includes: "_includes", // Relativo a 'input' (src/_includes)
            layouts: "_includes",  // Relativo a 'input'
            data: "_data",         // Relativo a 'input'
            output: "_site"    // Salida
        },

        // --- Motor de templates ---
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",

        // --- Templates permitidos ---
        templateFormats: ["html", "njk", "md"],
        pathPrefix: "/"
    };
};
