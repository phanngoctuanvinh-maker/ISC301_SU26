const db = require('./src/config/db');
const { getPublicProductBySlug } = require('./src/modules/product/product.service');

async function main() {
  try {
    const product = await getPublicProductBySlug('giay-puma-dribble-nu', null);
    console.log('Product Combo details:');
    console.log('price:', product.price);
    console.log('discount_price:', product.discount_price);
    console.log('combo:', product.combo);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
