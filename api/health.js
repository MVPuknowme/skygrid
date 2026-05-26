const { skygridHandler } = require('./_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/health',
  methods: ['GET'],
  classification: 'live'
});
