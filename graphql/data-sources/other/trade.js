const TradeRoleDataSource = require('./trade-role');
const {
  models: { Student, TrainingOfficer, Trade },
} = require('../config');

exports.Trade = class extends TradeRoleDataSource {
  constructor() {
    super(Trade, TrainingOfficer, Student);
  }

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
