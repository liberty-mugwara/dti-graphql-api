const TradeRoleDataSource = require('./trade-role');
const {
  models: { Manager, Admin, Role },
} = require('../config');

exports.Role = class extends TradeRoleDataSource {
  constructor() {
    super(Role, Manager, Admin);
  }
  async getManagers(id, options) {
    return this.getLinked(id, 'Manager', options);
  }

  async countManagers(id, options) {
    return this.countLinked(id, 'Manager', options);
  }

  async getAdmins(id, options) {
    return this.getLinked(id, 'Admin', options);
  }

  async countAdmins(id, options) {
    return this.countLinked(id, 'Admin', options);
  }
};
