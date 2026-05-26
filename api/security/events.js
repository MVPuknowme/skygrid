const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/security/events',
  methods: ['POST'],
  classification: 'live'
});
