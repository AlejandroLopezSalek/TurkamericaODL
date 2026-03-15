module.exports = {
    // Get the base layout name with locale suffix
    getLayout: function (locale) {
        const loc = locale || 'es';
        return loc === 'es' ? 'base.njk' : `base_${loc}.njk`;
    }
};
