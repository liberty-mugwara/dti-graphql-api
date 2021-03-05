const isString = val => typeof val === 'string';

const lowerFirstChar = string => {
  if (isString(string)) return string[0].toLowerCase() + string.slice(1);
  return string;
};
const capitalize = string => {
  if (isString(string))
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  return string;
};

module.exports = {
  isString,
  capitalize,
  lowerFirstChar,
};
