const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/validators/heartbeat',
  methods: ['POST'],
  classification: 'live'
});
