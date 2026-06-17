function parsePositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function getPagination(query) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 12, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  getPagination,
  buildPagination
};
