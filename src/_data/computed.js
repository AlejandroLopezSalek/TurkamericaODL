module.exports = {
    // This runs for each template
    layout: function (data) {
        const locale = data.locale || 'es';
        return locale === 'es' ? 'base.njk' : `base_${locale}.njk`;
    }
};
