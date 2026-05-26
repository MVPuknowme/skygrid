const { skygridHandler } = require('../_skygrid');

module.exports = (req, res) => skygridHandler(req, res, {
  route: '/return/access',
  methods: ['POST'],
  classification: 'protected'
});
