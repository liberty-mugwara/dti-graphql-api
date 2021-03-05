// helper functions
const prepareFieldsToPopulate = ({ fieldNodes = [] }) => {
  // we only support level 0 and level 1
  const getNested = data => {
    let name = [];
    if (data.selectionSet) {
      name.push({
        path: data.name.value,
        populate: data.selectionSet.selections
          .map(getNested)
          .filter(value => typeof value === 'object'),
      });
    } else name = data.name.value;
    return name;
  };

  // get nested selections so we know which fields to populate
  const nestedSelections = new Map();
  fieldNodes.forEach(({ selectionSet: { selections } }) =>
    selections.map(selection => {
      if (selection.selectionSet) {
        nestedSelections.set(
          selection.name.value,
          selection.selectionSet.selections
            .map(getNested)
            .filter(value => typeof value === 'object')
        );
      }
      return selection.name.value;
    })
  );

  return nestedSelections;
};

// will work for one person or an array of persons
// populates required fields only
const populateDocument = async (info, documents, level = 0) => {
  // only 2 levels ar supported 0 and 1
  // 0 includes base keys in population data
  // 1 excludes base keys
  try {
    const nestedSelections = prepareFieldsToPopulate(info);
    if (nestedSelections.size) {
      let toPopulate = [];
      nestedSelections.forEach((value, key) => {
        if (!level) {
          const data = {};
          data.path = key;
          if (value?.length) data.populate = value;
          toPopulate.push(data);
        } else toPopulate = value;
      });

      // run in || for better performance
      const populated = await Promise.all(
        (Array.isArray(documents) ? documents : [documents]).map(person =>
          person.populate(toPopulate).execPopulate()
        )
      );
      return (Array.isArray(documents) && populated) || populated[0];
    }
    // no need to populate fields
    return documents;
  } catch (e) {
    throw e;
  }
};

const getAndPopulate = async (promise, resolversInfo, level = 0) => {
  try {
    const docs = await promise;
    // this might boost performance
    if (!docs || (Array.isArray(docs) && !docs.length)) return docs;
    return await populateDocument(resolversInfo, docs, level);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  prepareFieldsToPopulate,
  populateDocument,
  getAndPopulate,
};
