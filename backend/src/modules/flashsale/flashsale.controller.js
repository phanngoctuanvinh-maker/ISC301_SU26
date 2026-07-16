const flashSaleService = require('./flashsale.service');
const { successResponse } = require('../../utils/response.util');

async function handleCreate(req, res, next) {
  try {
    const result = await flashSaleService.createFlashSale(req.body);
    return successResponse(res, { id: result.id }, result.message, 201);
  } catch (error) {
    next(error);
  }
}

async function handleListAll(req, res, next) {
  try {
    const data = await flashSaleService.listAllFlashSales();
    return successResponse(res, data, 'Lấy danh sách Flash Sale thành công');
  } catch (error) {
    next(error);
  }
}

async function handleDelete(req, res, next) {
  try {
    const result = await flashSaleService.deleteFlashSale(req.params.id);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

async function handleGetActiveOrUpcoming(req, res, next) {
  try {
    const data = await flashSaleService.getActiveOrUpcomingFlashSale();
    return successResponse(res, data, 'Lấy thông tin Flash Sale hiện tại thành công');
  } catch (error) {
    next(error);
  }
}


async function handleUpdate(req, res, next) {
  try {
    const result = await flashSaleService.updateFlashSale(req.params.id, req.body);
    return successResponse(res, { id: result.id }, result.message);
  } catch (error) {
    next(error);
  }
}


module.exports = {
  handleCreate,
  handleListAll,
  handleDelete,
  handleGetActiveOrUpcoming,
  handleUpdate
};
