const TradeRoleDataSource = require('./trade-role');

module.exports = class extends TradeRoleDataSource {
  async getTOs(id, options) {
    return this.getLinked(id, 'TrainingOfficer', options);
  }

  async countTOs(id, options) {
    return this.countLinked(id, 'TrainingOfficer', options);
  }

  async getStudents(id, options) {
    return this.getLinked(id, 'Student', options);
  }

  async countStudents(id, options) {
    return this.countLinked(id, 'Student', options);
  }
};
