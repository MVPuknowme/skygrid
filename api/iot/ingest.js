const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/api/iot/ingest',
  methods: ['POST'],
  classification: 'live'
});
