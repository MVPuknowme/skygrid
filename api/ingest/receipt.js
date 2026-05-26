const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/ingest/receipt',
  methods: ['POST'],
  classification: 'live'
});
