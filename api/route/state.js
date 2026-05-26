const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/route/state',
  methods: ['GET'],
  classification: 'live'
});
