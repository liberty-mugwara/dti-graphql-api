const successMsg = msg => res.status(200).json(msg);

function successMsgAsync(msg) {
  return function (callback) {
    res.status(200).json(msg);
    callback(null, msg);
  };
}

const successDeleteMsgAsync = (doc, callback) =>
  successMsg(callback(doc) + ' successfully deleted!');

module.exports = {
  successMsg,
  successMsgAsync,
  successDeleteMsgAsync,
  successDeleteMsgAsync,
};
