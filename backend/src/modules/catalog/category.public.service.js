const db = require('../../config/db');

async function getActiveCategoryTree() {
  const categories = await db.query(
    `
      SELECT id, parent_id, name, slug, image_url, sort_order
      FROM categories
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `
  );

  const parents = categories
    .filter(category => category.parent_id === null)
    .map(parent => ({
      ...parent,
      children: categories.filter(category => category.parent_id === parent.id)
    }));

  return parents;
}

module.exports = {
  getActiveCategoryTree
};
