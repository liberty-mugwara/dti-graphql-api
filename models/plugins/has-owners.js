const ObjectId = require('mongoose').Schema.Types.ObjectId;
const { lowerFirstChar } = require('../../helpers/strings');

module.exports = function hasOwnersPlugin(schema, options) {
  schema.add({
    owners: {
      admins: [{ type: ObjectId, ref: 'Admin' }],
      managers: [{ type: ObjectId, ref: 'Manager' }],
      students: [{ type: ObjectId, ref: 'Student' }],
      trainingOfficers: [{ type: ObjectId, ref: 'TrainingOfficer' }],
      nextOfKins: [{ type: ObjectId, ref: 'NextOfKin' }],
    },
  });

  schema.method({
    async removeOwner(owner) {
      try {
        const ownerKey = getOwnerKey(owner);
        // generate update data
        this.owners[ownerKey].remove(owner._id);
        for (const [, value] of Object.entries(this.owners)) {
          // if all values are empty this loop does nothing
          if (!value.length) continue;
          // if one value is not empty we stop iteration
          // save the document and return the owned value
          else return await this.save();
        }
        // reaching here the owned object has no owners so we remove it
        return await this.remove();
      } catch (e) {
        throw e;
      }
    },

    async addOwner(owner) {
      try {
        // add owner to owned
        this.owners[getOwnerKey(owner)].addToSet(owner._id);
        return await this.save();
      } catch (e) {
        throw e;
      }
    },
  });
};

// this is a helper function
function getOwnerKey(owner) {
  return lowerFirstChar(owner.getModelName()) + 's';
}
