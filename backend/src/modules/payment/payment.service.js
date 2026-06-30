const crypto = require('crypto');
const db = require('../../config/db');
const { transporter } = require('../../config/mail');
const { orderConfirmationEmailTemplate } = require('../../utils/email.templates');

/**
 * Format Date as YYYYMMDDHHmmss
 */
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Sort object keys alphabetically and URI encode
 */
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

const paymentService = {
  /**
   * Tạo URL thanh toán VNPAY cho đơn hàng
   */
  async createVNPayUrl(userId, orderId, ipAddr) {
    const order = await db.queryOne(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (!order) {
      throw { status: 404, message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' };
    }

    if (order.payment_status === 'paid') {
      throw { status: 400, message: 'Đơn hàng này đã được thanh toán' };
    }

    const tmnCode = process.env.VNP_TMN_CODE ? process.env.VNP_TMN_CODE.trim() : '';
    const secretKey = process.env.VNP_HASH_SECRET ? process.env.VNP_HASH_SECRET.trim() : '';
    const vnpUrl = process.env.VNP_URL ? process.env.VNP_URL.trim() : '';
    const returnUrl = process.env.VNP_RETURN_URL ? process.env.VNP_RETURN_URL.trim() : '';

    const createDate = formatDate(new Date());

    // Chuẩn hóa IP Address sang IPv4 để tránh VNPAY từ chối (VNPAY không nhận IPv6 ::1 của localhost)
    let cleanIp = ipAddr || '127.0.0.1';
    if (cleanIp === '::1' || cleanIp.includes('::ffff:') || cleanIp === 'localhost') {
      cleanIp = '127.0.0.1';
    }

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(Number(order.total_amount) * 100).toString(), // Đảm bảo số nguyên tuyệt đối
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: cleanIp,
      vnp_CreateDate: createDate
    };

    const sortedParams = sortObject(vnp_Params);
    
    // Tạo chuỗi sign data
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    console.log('[VNPAY Debug] Chuỗi dữ liệu thô ký (signData):', signData);
    console.log('[VNPAY Debug] Khóa bí mật (secretKey):', secretKey);

    const hmac = crypto.createHmac('sha512', secretKey);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('[VNPAY Debug] Chữ ký bảo mật (secureHash):', secureHash);

    // Nối thêm SecureHash vào URL thanh toán
    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return { paymentUrl };
  },

  /**
   * Xác minh chữ ký phản hồi VNPAY (cho Client-side return)
   */
  async verifyVNPayReturn(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];
    
    const secretKey = process.env.VNP_HASH_SECRET ? process.env.VNP_HASH_SECRET.trim() : '';
    
    // Copy và xóa các tham số chữ ký
    const params = { ...vnpParams };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    // Sắp xếp các tham số còn lại
    const sortedParams = sortObject(params);
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== calculatedHash) {
      return { success: false, message: 'Chữ ký không hợp lệ' };
    }

    const orderId = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];

    if (responseCode === '00') {
      const numericOrderId = parseInt(orderId);
      const transactionNo = vnpParams['vnp_TransactionNo'];

      // Cập nhật CSDL ngay lập tức nếu chưa được cập nhật bởi IPN (hữu ích khi test ở localhost vì webhook IPN không gọi được local)
      const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [numericOrderId]);
      if (order && order.payment_status !== 'paid') {
        const connection = await db.pool.getConnection();
        try {
          await connection.beginTransaction();

          // Cập nhật orders
          await connection.execute(
            'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
            ['paid', 'confirmed', numericOrderId]
          );

          // Trừ kho sản phẩm khi chuyển sang trạng thái confirmed
          const [items] = await connection.execute('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [numericOrderId]);
          for (const item of items) {
            await connection.execute(
              'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
              [item.quantity, item.variant_id]
            );
          }

          // Cập nhật payments
          await connection.execute(
            `UPDATE payments 
             SET status = ?, transaction_id = ?, gateway_response = ?, paid_at = CURRENT_TIMESTAMP 
             WHERE order_id = ?`,
            ['success', transactionNo, JSON.stringify(vnpParams), numericOrderId]
          );

          await connection.commit();

          // Gửi email xác nhận đơn hàng
          const user = await db.queryOne('SELECT full_name, email FROM users WHERE id = ?', [order.user_id]);
          if (user && user.email) {
            const orderItems = await db.query(
              `SELECT oi.*, p.name as product_name, pv.color, pv.size
               FROM order_items oi
               JOIN product_variants pv ON pv.id = oi.variant_id
               JOIN products p ON p.id = pv.product_id
               WHERE oi.order_id = ?`,
              [numericOrderId]
            );

            const orderObj = {
              ...order,
              payment_status: 'paid',
              status: 'confirmed'
            };

            const { subject, html } = orderConfirmationEmailTemplate(user.full_name, orderObj, orderItems);
            transporter.sendMail({
              from: process.env.MAIL_FROM,
              to: user.email,
              subject,
              html
            }).catch(err => {
              console.error('Lỗi khi gửi email xác nhận đơn hàng thanh toán trực tuyến từ Return URL:', err);
            });
          }
        } catch (dbErr) {
          await connection.rollback();
          console.error('Error updating order on Return verification:', dbErr);
        } finally {
          connection.release();
        }
      }

      return {
        success: true,
        orderId,
        amount: Number(vnpParams['vnp_Amount']) / 100,
        transactionNo: transactionNo,
        message: 'Thanh toán thành công'
      };
    } else {
      return {
        success: false,
        orderId,
        message: `Thanh toán thất bại, mã phản hồi: ${responseCode}`
      };
    }
  },

  /**
   * Xử lý IPN callback từ VNPAY Server (Cập nhật database và gửi email)
   */
  async handleVNPayIPN(vnpParams) {
    try {
      const secureHash = vnpParams['vnp_SecureHash'];
      const secretKey = process.env.VNP_HASH_SECRET ? process.env.VNP_HASH_SECRET.trim() : '';

      const params = { ...vnpParams };
      delete params['vnp_SecureHash'];
      delete params['vnp_SecureHashType'];

      const sortedParams = sortObject(params);
      const signData = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', secretKey);
      const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // 1. Kiểm tra chữ ký bảo mật
      if (secureHash !== calculatedHash) {
        return { RspCode: '97', Message: 'Invalid checksum' };
      }

      const orderId = parseInt(vnpParams['vnp_TxnRef']);
      const vnpAmount = Number(vnpParams['vnp_Amount']) / 100;
      const responseCode = vnpParams['vnp_ResponseCode'];
      const transactionNo = vnpParams['vnp_TransactionNo'];

      // 2. Tìm đơn hàng trong DB
      const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // 3. Kiểm tra số tiền (VNPAY gửi số tiền thực tế thanh toán)
      if (Number(order.total_amount) !== vnpAmount) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // 4. Kiểm tra trạng thái xác nhận của đơn hàng
      if (order.payment_status === 'paid') {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // 5. Cập nhật trạng thái
      const connection = await db.pool.getConnection();
      try {
        await connection.beginTransaction();

        const isSuccess = responseCode === '00';
        const paymentStatus = isSuccess ? 'paid' : 'failed';
        const orderStatus = isSuccess ? 'confirmed' : 'pending';

        // Cập nhật orders
        await connection.execute(
          'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
          [paymentStatus, orderStatus, orderId]
        );

        // Trừ kho sản phẩm khi chuyển sang trạng thái confirmed (thanh toán thành công)
        if (isSuccess) {
          const [items] = await connection.execute('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
          for (const item of items) {
            await connection.execute(
              'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
              [item.quantity, item.variant_id]
            );
          }
        }

        // Cập nhật payments
        await connection.execute(
          `UPDATE payments 
           SET status = ?, transaction_id = ?, gateway_response = ?, paid_at = CURRENT_TIMESTAMP 
           WHERE order_id = ?`,
          [isSuccess ? 'success' : 'failed', transactionNo, JSON.stringify(vnpParams), orderId]
        );

        await connection.commit();

        // Gửi email xác nhận đơn hàng nếu thanh toán thành công
        if (isSuccess) {
          const user = await db.queryOne('SELECT full_name, email FROM users WHERE id = ?', [order.user_id]);
          if (user && user.email) {
            const orderItems = await db.query(
              `SELECT oi.*, p.name as product_name, pv.color, pv.size
               FROM order_items oi
               JOIN product_variants pv ON pv.id = oi.variant_id
               JOIN products p ON p.id = pv.product_id
               WHERE oi.order_id = ?`,
              [orderId]
            );

            const orderObj = {
              ...order,
              payment_status: 'paid',
              status: 'confirmed'
            };

            const { subject, html } = orderConfirmationEmailTemplate(user.full_name, orderObj, orderItems);
            transporter.sendMail({
              from: process.env.MAIL_FROM,
              to: user.email,
              subject,
              html
            }).catch(err => {
              console.error('Lỗi khi gửi email xác nhận đơn hàng thanh toán trực tuyến:', err);
            });
          }
        }

        return { RspCode: '00', Message: 'Confirm success' };
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Lỗi xử lý VNPAY IPN:', error);
      return { RspCode: '99', Message: 'Input required data invalid or internal error' };
    }
  }
};

module.exports = paymentService;
