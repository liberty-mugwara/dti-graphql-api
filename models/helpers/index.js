const { throw400, isError404, throw403 } = require('../../helpers/errors');
const { lowerFirstChar, isString } = require('../../helpers/strings');

/* ===> UTILITY: Do not export <=== */
const getKey = Model => lowerFirstChar(Model.modelName);

/* == END == */

/* ===> DOES NOT require binding <=== */
const idsMatch = (id1, id2) => {
  if (id1 && id2) {
    return (
      (isString(id1) ? id1 : id1?.toString()) ===
      (isString(id2) ? id2 : id2?.toString())
    );
  }
  return false;
};

const addOwned = OwnedModel => {
  return async (person, ownedCreateData) => {
    try {
      const ownedRefKey = getKey(OwnedModel);
      if (!person[ownedRefKey]) {
        const owned = await OwnedModel.createDocument(ownedCreateData);
        person[ownedRefKey] = owned;
        return await owned.addOwner(person);
      }
    } catch (e) {
      throw e;
    }
  };
};

const updateTradeOrRole = TradeOrRoleModel => {
  return async (person, tradeOrRoleId = '') => {
    try {
      // prevent hitting the db is no changes
      if (!tradeOrRoleId || idsMatch(person._id, tradeOrRoleId)) return;

      const refKey = getKey(TradeOrRoleModel);
      const tradeOrRole = await TradeOrRoleModel.getDocument(tradeOrRoleId);
      person[refKey] = tradeOrRole;
    } catch (e) {
      throw e;
    }
  };
};

const addOrUpdateOwned = OwnedModel => {
  // works only for Address and NextOfKin
  return async (owner, ownedData) => {
    try {
      // prevent hitting the db is no data
      if (!ownedData) return;

      const ownedRefKey = getKey(OwnedModel);
      const { _id, id, owners, ...safeOwnedData } = ownedData;
      let owned;

      //   populate owned path
      await owner.populate(ownedRefKey).execPopulate();

      // check if a new owned doc should be created or changed
      if (id && !idsMatch(id, owner[ownedRefKey]?._id)) {
        // check if owned exists
        owned = await docExists.call(OwnedModel, id);

        // deal with previous owned doc
        owner[ownedRefKey]?.removeOwner(owner);

        if (owned) {
          // config new owned doc
          owner[ownedRefKey] = owned;
          await owned.addOwner(owner);
          return owned;
        } else {
          // important for the below code to work
          owner[ownedRefKey] = undefined;
          // create and add owned doc
          return await addOwned(OwnedModel)(owner, safeOwnedData);
        }
      }

      // if owned doc details should be modified
      if (owner.populated(ownedRefKey)) {
        const owned = await OwnedModel['update' + OwnedModel?.modelName](
          owner[ownedRefKey]?._id,
          safeOwnedData
        );
        owner[ownedRefKey] = owned;
        return owned;
      }
    } catch (e) {
      throw e;
    }
  };
};
/* == END == */

/* ===> REQUIRES binding this <=== */
function checkAllowedUpdates(updateData, allowedUpdates, exclude = []) {
  if (typeof updateData !== 'object' || Array.isArray(updateData))
    throw400('__all', '_', `Update data should be of object type`);

  let invalidKey = '';
  const allowUpdate = Object.keys(updateData).every(key => {
    invalidKey = key;
    return allowedUpdates.includes(key) || exclude.includes(key);
  });

  if (!allowUpdate)
    throw403.call(this, invalidKey, updateData[invalidKey], 'update');
}

async function docExists(id = '') {
  // works on documents that uses the getDocument method
  try {
    return await this.getDocument(id);
  } catch (e) {
    if (isError404(e)) return false;
    throw e;
  }
}
/* == END == */

module.exports = {
  addOrUpdateOwned,
  addOwned,
  checkAllowedUpdates,
  docExists,
  idsMatch,
  updateTradeOrRole,
};
