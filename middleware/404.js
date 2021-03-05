module.exports = (req, res, next) => {
  if (req.path === '/graphql') return next();
  res.status(404).json({ 404: 'Path not found' });
};
