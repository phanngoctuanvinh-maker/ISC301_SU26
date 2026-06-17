# Shoes Store API Documentation

Tài liệu mô tả chi tiết toàn bộ API của dự án Shoes Store (bán giày) được phát triển bằng Node.js, Express.js và MySQL.

---

## Thông Tin Chung (Overview)

- **Base URL**: `http://localhost:8080`
- **Định dạng dữ liệu**: `application/json` (ngoại trừ các API upload file sử dụng `multipart/form-data`)
- **Xác thực (Authentication)**: 
  - Sử dụng **JWT Token** truyền qua Header dưới dạng: `Authorization: Bearer <JWT_TOKEN>`
  - Các API yêu cầu đăng nhập hoặc quyền Admin được chú thích rõ trong từng phần dưới đây.

---

## Danh Sách Các Module

1. [Module 1: Authentication (Xác thực)](#1-authentication-xác-thực)
2. [Module 2: Profile (Thông tin cá nhân)](#2-profile-thông-tin-cá-nhân)
3. [Module 3: Admin Categories (Quản lý danh mục)](#3-admin-categories-quản-lý-danh-mục)
4. [Module 4: Admin Brands (Quản lý thương hiệu)](#4-admin-brands-quản-lý-thương-hiệu)
5. [Module 5: User Addresses (Địa chỉ nhận hàng)](#5-user-addresses-địa-chỉ-nhận-hàng)

---

## 1. Authentication (Xác thực)

Các API trong module này không yêu cầu xác thực JWT Token để truy cập.

### 1.1. Đăng ký tài khoản mới

Tạo một tài khoản người dùng mới. Sau khi đăng ký thành công, hệ thống tự động gửi mã OTP 6 số qua email của người dùng để xác thực.

* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `full_name` | String | Có | Độ dài từ 2 đến 100 ký tự | Nguyễn Văn A |
    | `email` | String | Có | Định dạng email hợp lệ | nguyenvana@gmail.com |
    | `password` | String | Có | Ít nhất 8 ký tự, gồm ít nhất: 1 chữ hoa, 1 chữ thường và 1 chữ số | Password123 |
    | `phone` | String | Không | Định dạng số điện thoại Việt Nam (ví dụ: `^0\d{9}$`) | 0987654321 |

* **Response (rs)**:
  * **201 Created**: Đăng ký thành công, hệ thống đã gửi OTP.
    ```json
    {
      "success": true,
      "message": "Đăng ký thành công, vui lòng kiểm tra OTP trong email."
    }
    ```
  * **400 Bad Request**: Validate dữ liệu thất bại hoặc email đã tồn tại trong hệ thống.
    ```json
    {
      "success": false,
      "message": "Email đã tồn tại hoặc dữ liệu đầu vào không hợp lệ."
    }
    ```

---

### 1.2. Xác minh mã OTP

Xác thực tài khoản người dùng bằng cách cung cấp mã OTP 6 số đã được gửi qua email.

* **URL**: `/api/auth/verify-otp`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `email` | String | Có | Định dạng email hợp lệ | nguyenvana@gmail.com |
    | `otp` | String | Có | Mã OTP 6 chữ số | "123456" |

* **Response (rs)**:
  * **200 OK**: Xác minh tài khoản thành công.
    ```json
    {
      "success": true,
      "message": "Xác minh tài khoản thành công."
    }
    ```
  * **400 Bad Request**: OTP không chính xác hoặc đã hết hạn.
    ```json
    {
      "success": false,
      "message": "OTP không chính xác hoặc đã hết hạn."
    }
    ```

---

### 1.3. Gửi lại mã OTP

Yêu cầu hệ thống tạo và gửi lại mã OTP mới đến email nếu mã OTP cũ đã hết hạn.

* **URL**: `/api/auth/resend-otp`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `email` | String | Có | Định dạng email hợp lệ | nguyenvana@gmail.com |

* **Response (rs)**:
  * **200 OK**: Đã gửi lại OTP mới thành công.
    ```json
    {
      "success": true,
      "message": "Đã gửi lại OTP mới thành công."
    }
    ```
  * **400 Bad Request**: Email chưa được đăng ký trong hệ thống hoặc có lỗi xảy ra.
    ```json
    {
      "success": false,
      "message": "Email chưa đăng ký hoặc có lỗi xảy ra."
    }
    ```

---

### 1.4. Đăng nhập bằng email & password

Xác thực tài khoản và cấp JWT Token cho người dùng để truy cập vào các API bảo mật khác.

* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `email` | String | Có | Định dạng email | admin@gmail.com |
    | `password` | String | Có | Mật khẩu tài khoản | AdminPassword123 |

* **Response (rs)**:
  * **200 OK**: Đăng nhập thành công, trả về JWT Token và thông tin user.
    ```json
    {
      "success": true,
      "message": "Đăng nhập thành công",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzE4Njc1NjAwfQ...",
        "user": {
          "id": 1,
          "full_name": "Admin Store",
          "email": "admin@gmail.com",
          "role": "admin"
        }
      }
    }
    ```
  * **401 Unauthorized**: Sai mật khẩu hoặc tài khoản chưa kích hoạt qua OTP.
    ```json
    {
      "success": false,
      "message": "Sai mật khẩu hoặc tài khoản chưa kích hoạt."
    }
    ```

---

### 1.5. Đăng nhập bằng tài khoản Google

Xác thực thông qua tài khoản Google từ phía Client (OAuth2) và trả về JWT Token của hệ thống.

* **URL**: `/api/auth/google`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `credential` | String | Có | ID Token chuỗi nhận được từ Google Sign-In | Google_Id_Token_String_Here |

* **Response (rs)**:
  * **200 OK**: Đăng nhập Google thành công.
    ```json
    {
      "success": true,
      "message": "Đăng nhập Google thành công.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 2,
          "full_name": "Nguyễn Văn Google",
          "email": "vangoogle@gmail.com",
          "role": "user"
        }
      }
    }
    ```

---

## 2. Profile (Thông tin cá nhân)

Tất cả các API trong module này yêu cầu đăng nhập. 
* **Yêu cầu xác thực**: Header `Authorization: Bearer <JWT_TOKEN>`

### 2.1. Lấy thông tin cá nhân hiện tại

Lấy thông tin chi tiết của người dùng đang đăng nhập dựa trên token.

* **URL**: `/api/profile`
* **Method**: `GET`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`

* **Response (rs)**:
  * **200 OK**: Lấy thông tin thành công.
    ```json
    {
      "success": true,
      "message": "Lấy thông tin thành công.",
      "data": {
        "id": 2,
        "full_name": "Nguyễn Văn B",
        "email": "nguyenvanb@gmail.com",
        "phone": "0912345678",
        "address": "123 Đường ABC, Quận 1, TP. HCM",
        "gender": "nam",
        "dob": "1995-10-15",
        "avatar": "/uploads/avatars/user-2.png",
        "role": "user"
      }
    }
    ```

---

### 2.2. Cập nhật thông tin cá nhân

Cập nhật các thông tin cơ bản của tài khoản hiện tại.

* **URL**: `/api/profile`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `full_name` | String | Không | Tên hiển thị mới | Nguyễn Văn B |
    | `phone` | String | Không | Định dạng số điện thoại Việt Nam | 0912345678 |
    | `address` | String | Không | Địa chỉ cụ thể | 123 Đường ABC, Quận 1, TP. HCM |
    | `gender` | String | Không | Phải thuộc: `nam`, `nu`, `khac` | nam |
    | `dob` | String | Không | Định dạng ngày `YYYY-MM-DD` | "1995-10-15" |

* **Response (rs)**:
  * **200 OK**: Cập nhật thành công.
    ```json
    {
      "success": true,
      "message": "Cập nhật thành công."
    }
    ```

---

### 2.3. Đổi mật khẩu

Thay đổi mật khẩu đăng nhập của tài khoản hiện tại.

* **URL**: `/api/profile/change-password`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `old_password` | String | Có | Mật khẩu hiện tại | Password123 |
    | `new_password` | String | Có | Mật khẩu mới (ít nhất 8 kí tự, chữ hoa, thường và số) | NewPassword123 |

* **Response (rs)**:
  * **200 OK**: Đổi mật khẩu thành công.
    ```json
    {
      "success": true,
      "message": "Đổi mật khẩu thành công."
    }
    ```
  * **400 Bad Request**: Mật khẩu cũ không chính xác hoặc mật khẩu mới trùng khớp với mật khẩu cũ.
    ```json
    {
      "success": false,
      "message": "Mật khẩu cũ không đúng hoặc mật khẩu mới trùng mật khẩu cũ."
    }
    ```

---

### 2.4. Cập nhật ảnh đại diện (Avatar)

Tải lên file ảnh mới để thay thế ảnh đại diện hiện tại.

* **URL**: `/api/profile/avatar`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
  * **Form Data Body**:
    | Key | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Mô tả |
    | :--- | :--- | :--- | :--- | :--- |
    | `avatar` | File / Binary | Có | Định dạng JPG, PNG, WEBP. Dung lượng tối đa 2MB | File ảnh tải lên từ máy |

* **Response (rs)**:
  * **200 OK**: Cập nhật ảnh đại diện thành công.
    ```json
    {
      "success": true,
      "message": "Cập nhật ảnh đại diện thành công.",
      "avatar_url": "/uploads/avatars/avatar-123456.png"
    }
    ```

---

## 3. Admin Categories (Quản lý danh mục)

Các API này yêu cầu đăng nhập với tài khoản có quyền quản trị (**Admin**).
* **Yêu cầu xác thực**: Header `Authorization: Bearer <JWT_TOKEN>` (User có `role: "admin"`)

### 3.1. Lấy cây danh mục 2 tầng (Cha -> Con)

Lấy cấu trúc cây danh mục sản phẩm gồm 2 tầng chính (Danh mục cha -> Các danh mục con liên kết).

* **URL**: `/api/admin/categories`
* **Method**: `GET`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`

* **Response (rs)**:
  * **200 OK**: Lấy danh sách thành công.
    ```json
    {
      "success": true,
      "message": "Lấy danh sách thành công.",
      "data": [
        {
          "id": 1,
          "name": "Giày Thể Thao",
          "parent_id": null,
          "sort_order": 1,
          "image": "/uploads/categories/sports.png",
          "is_active": true,
          "children": [
            {
              "id": 3,
              "name": "Giày Nike Nam",
              "parent_id": 1,
              "sort_order": 1,
              "image": "/uploads/categories/nike-nam.png",
              "is_active": true
            }
          ]
        }
      ]
    }
    ```

---

### 3.2. Tạo danh mục mới

Thêm mới một danh mục sản phẩm (Hỗ trợ upload ảnh danh mục).

* **URL**: `/api/admin/categories`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
  * **Form Data Body**:
    | Key | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mô tả | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `name` | String | Có | Tên danh mục mới | Giày Nike Nam |
    | `parent_id` | String | Không | ID của danh mục cha. Trống hoặc `"null"` nếu là danh mục cha cao nhất | "1" |
    | `sort_order` | String | Không | Thứ tự hiển thị danh mục | "1" |
    | `image` | File / Binary | Không | Ảnh mô tả danh mục (định dạng JPG, PNG, WEBP tối đa 2MB) | File ảnh tải lên |

* **Response (rs)**:
  * **201 Created**: Tạo danh mục thành công.
    ```json
    {
      "success": true,
      "message": "Tạo danh mục thành công.",
      "data": {
        "id": 3,
        "name": "Giày Nike Nam",
        "parent_id": 1,
        "sort_order": 1,
        "image": "/uploads/categories/nike-nam.png",
        "is_active": true
      }
    }
    ```

---

### 3.3. Cập nhật danh mục

Cập nhật các thông tin của một danh mục hiện có theo ID.

* **URL**: `/api/admin/categories/{id}`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID của danh mục cần cập nhật. (Ví dụ: `3`)
  * **Form Data Body**:
    | Key | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mô tả | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `name` | String | Không | Tên danh mục cập nhật | Giày Nike Nam Cận Cao Cấp |
    | `parent_id` | String | Không | ID danh mục cha mới | "1" |
    | `sort_order` | String | Không | Thứ tự hiển thị mới | "5" |
    | `image` | File / Binary | Không | Ảnh mới cần thay thế | File ảnh tải lên |

* **Response (rs)**:
  * **200 OK**: Cập nhật thành công.
    ```json
    {
      "success": true,
      "message": "Cập nhật thành công."
    }
    ```

---

### 3.4. Ẩn/Hiện danh mục (Toggle is_active)

Chuyển đổi trạng thái hoạt động (Ẩn hoặc Hiện) của danh mục. Nếu ẩn danh mục cha, các danh mục con của nó cũng sẽ tự động ẩn theo.

* **URL**: `/api/admin/categories/{id}/toggle-status`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID của danh mục. (Ví dụ: `1`)

* **Response (rs)**:
  * **200 OK**: Thay đổi trạng thái thành công.
    ```json
    {
      "success": true,
      "message": "Thay đổi trạng thái thành công. Ẩn cha sẽ tự ẩn con."
    }
    ```

---

### 3.5. Sắp xếp lại danh mục

Cập nhật lại hàng loạt giá trị thứ tự sắp xếp (`sort_order`) của các danh mục.

* **URL**: `/api/admin/categories/reorder`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
    | :--- | :--- | :--- | :--- |
    | `items` | Array | Có | Danh sách các đối tượng danh mục cần sắp xếp lại |

    *Chi tiết phần tử trong mảng `items`:*
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả / Ví dụ |
    | :--- | :--- | :--- | :--- |
    | `id` | Integer | Có | ID danh mục cần sắp xếp (ví dụ: `1`) |
    | `sort_order` | Integer | Có | Thứ tự sắp xếp mới (ví dụ: `10`) |

* **Response (rs)**:
  * **200 OK**: Sắp xếp lại thành công.
    ```json
    {
      "success": true,
      "message": "Sắp xếp lại thành công."
    }
    ```

---

## 4. Admin Brands (Quản lý thương hiệu)

Các API quản lý thương hiệu yêu cầu quyền quản trị (**Admin**).
* **Yêu cầu xác thực**: Header `Authorization: Bearer <JWT_TOKEN>` (User có `role: "admin"`)

### 4.1. Lấy toàn bộ thương hiệu kèm số sản phẩm

Lấy danh sách tất cả các thương hiệu trong cơ sở dữ liệu kèm theo số lượng sản phẩm thuộc thương hiệu đó.

* **URL**: `/api/admin/brands`
* **Method**: `GET`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`

* **Response (rs)**:
  * **200 OK**: Lấy danh sách thành công.
    ```json
    {
      "success": true,
      "message": "Lấy danh sách thành công.",
      "data": [
        {
          "id": 1,
          "name": "Nike",
          "description": "Thương hiệu thể thao nổi tiếng của Mỹ.",
          "logo": "/uploads/brands/nike-logo.png",
          "is_active": true,
          "product_count": 25
        }
      ]
    }
    ```

---

### 4.2. Tạo thương hiệu mới

Tạo mới một thương hiệu giày (Hỗ trợ upload ảnh Logo).

* **URL**: `/api/admin/brands`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
  * **Form Data Body**:
    | Key | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mô tả | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `name` | String | Có | Tên thương hiệu mới | Nike |
    | `description` | String | Không | Mô tả ngắn gọn về thương hiệu | Thương hiệu thể thao nổi tiếng của Mỹ. |
    | `logo` | File / Binary | Không | Ảnh logo thương hiệu (JPG, PNG, WEBP tối đa 2MB) | File ảnh tải lên |

* **Response (rs)**:
  * **201 Created**: Tạo thương hiệu thành công.
    ```json
    {
      "success": true,
      "message": "Tạo thương hiệu thành công.",
      "data": {
        "id": 1,
        "name": "Nike",
        "description": "Thương hiệu thể thao nổi tiếng của Mỹ.",
        "logo": "/uploads/brands/nike-logo.png",
        "is_active": true
      }
    }
    ```

---

### 4.3. Cập nhật thương hiệu

Cập nhật thông tin của một thương hiệu đã tồn tại dựa trên ID.

* **URL**: `/api/admin/brands/{id}`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID của thương hiệu cần cập nhật. (Ví dụ: `1`)
  * **Form Data Body**:
    | Key | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mô tả | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `name` | String | Không | Tên thương hiệu cập nhật | Nike Store |
    | `description` | String | Không | Mô tả cập nhật mới | Mô tả mới cập nhật. |
    | `logo` | File / Binary | Không | File logo mới thay thế | File ảnh tải lên |

* **Response (rs)**:
  * **200 OK**: Cập nhật thành công.
    ```json
    {
      "success": true,
      "message": "Cập nhật thành công."
    }
    ```

---

### 4.4. Ẩn/Hiện thương hiệu

Bật/Tắt trạng thái hoạt động (`is_active`) của một thương hiệu cụ thể.

* **URL**: `/api/admin/brands/{id}/toggle-status`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID thương hiệu. (Ví dụ: `1`)

* **Response (rs)**:
  * **200 OK**: Thay đổi trạng thái thương hiệu thành công.
    ```json
    {
      "success": true,
      "message": "Thay đổi trạng thái thương hiệu thành công."
    }
    ```

---

## 5. User Addresses (Địa chỉ nhận hàng)

Các API quản lý danh sách địa chỉ nhận hàng của người dùng.
* **Yêu cầu xác thực**: Header `Authorization: Bearer <JWT_TOKEN>`

### 5.1. Lấy danh sách địa chỉ của người dùng

Lấy toàn bộ danh sách các địa chỉ giao nhận hàng của tài khoản đang đăng nhập.

* **URL**: `/api/addresses`
* **Method**: `GET`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`

* **Response (rs)**:
  * **200 OK**: Lấy danh sách địa chỉ thành công.
    ```json
    {
      "success": true,
      "message": "Lấy danh sách địa chỉ thành công",
      "data": [
        {
          "id": 1,
          "user_id": 2,
          "receiver_name": "Nguyễn Văn A",
          "phone": "0987654321",
          "address_line": "123 Đường ABC",
          "ward": "Phường 1",
          "district": "Quận 1",
          "city": "TP. Hồ Chí Minh",
          "is_default": true,
          "created_at": "2026-06-17T13:56:22.000Z",
          "updated_at": "2026-06-17T13:56:22.000Z"
        }
      ]
    }
    ```

---

### 5.2. Thêm một địa chỉ mới

Thêm mới một địa chỉ giao hàng cho tài khoản hiện tại.

* **URL**: `/api/addresses`
* **Method**: `POST`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `receiver_name`| String | Có | Tên người nhận (2 - 100 kí tự) | Nguyễn Văn A |
    | `phone` | String | Có | Số điện thoại nhận hàng (Regex: `^0\d{9}$`) | 0987654321 |
    | `address_line` | String | Có | Số nhà, tên đường (5 - 255 kí tự) | 123 Đường ABC |
    | `ward` | String | Không | Phường/Xã (Tối đa 100 kí tự, có thể `null`) | Phường 1 |
    | `district` | String | Có | Quận/Huyện (Tối đa 100 kí tự) | Quận 1 |
    | `city` | String | Có | Tỉnh/Thành phố (Tối đa 100 kí tự) | TP. Hồ Chí Minh |

* **Response (rs)**:
  * **201 Created**: Thêm địa chỉ thành công.
    ```json
    {
      "success": true,
      "message": "Thêm địa chỉ thành công",
      "data": {
        "id": 2,
        "user_id": 2,
        "receiver_name": "Nguyễn Văn A",
        "phone": "0987654321",
        "address_line": "123 Đường ABC",
        "ward": "Phường 1",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh",
        "is_default": false
      }
    }
    ```

---

### 5.3. Cập nhật thông tin địa chỉ

Cập nhật thông tin của một địa chỉ nhận hàng theo ID.

* **URL**: `/api/addresses/{id}`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID địa chỉ cần cập nhật. (Ví dụ: `1`)
  * **Body Payload**:
    | Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Validation | Ví dụ |
    | :--- | :--- | :--- | :--- | :--- |
    | `receiver_name`| String | Không | Tên người nhận (2 - 100 kí tự) | Nguyễn Văn B |
    | `phone` | String | Không | Số điện thoại nhận hàng (Regex: `^0\d{9}$`) | 0912345678 |
    | `address_line` | String | Không | Số nhà, tên đường (5 - 255 kí tự) | 456 Đường XYZ |
    | `ward` | String | Không | Phường/Xã (Tối đa 100 kí tự, có thể `null`) | Phường 2 |
    | `district` | String | Không | Quận/Huyện (Tối đa 100 kí tự) | Quận 3 |
    | `city` | String | Không | Tỉnh/Thành phố (Tối đa 100 kí tự) | TP. Hồ Chí Minh |

* **Response (rs)**:
  * **200 OK**: Cập nhật địa chỉ thành công.
    ```json
    {
      "success": true,
      "message": "Cập nhật địa chỉ thành công."
    }
    ```
  * **400 Bad Request**: Yêu cầu không hợp lệ hoặc dữ liệu sai định dạng validation.
  * **403 Forbidden**: Không có quyền chỉnh sửa địa chỉ của người khác.
    ```json
    {
      "success": false,
      "message": "Không có quyền sửa địa chỉ này."
    }
    ```
  * **404 Not Found**: Địa chỉ không tồn tại trong hệ thống.
    ```json
    {
      "success": false,
      "message": "Địa chỉ không tồn tại."
    }
    ```

---

### 5.4. Xóa địa chỉ

Xóa hoàn toàn một địa chỉ nhận hàng khỏi danh sách.

* **URL**: `/api/addresses/{id}`
* **Method**: `DELETE`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID địa chỉ cần xóa. (Ví dụ: `1`)

* **Response (rs)**:
  * **200 OK**: Xoá địa chỉ thành công.
    ```json
    {
      "success": true,
      "message": "Xoá địa chỉ thành công."
    }
    ```
  * **403 Forbidden**: Không có quyền xóa địa chỉ này.
    ```json
    {
      "success": false,
      "message": "Không có quyền xóa địa chỉ này."
    }
    ```
  * **404 Not Found**: Địa chỉ không tồn tại.

---

### 5.5. Đặt địa chỉ làm mặc định

Thiết lập một địa chỉ nhận hàng làm địa chỉ mặc định để ưu tiên chọn khi thanh toán đơn hàng.

* **URL**: `/api/addresses/{id}/default`
* **Method**: `PUT`
* **Request (rp)**:
  * **Headers**: `Authorization: Bearer <JWT_TOKEN>`
  * **Path Parameters**:
    - `id` (Integer, bắt buộc): ID địa chỉ. (Ví dụ: `1`)

* **Response (rs)**:
  * **200 OK**: Đặt địa chỉ mặc định thành công hoặc địa chỉ này đã là mặc định.
    ```json
    {
      "success": true,
      "message": "Đặt địa chỉ mặc định thành công."
    }
    ```
  * **403 Forbidden**: Không có quyền thao tác trên địa chỉ của người khác.
    ```json
    {
      "success": false,
      "message": "Không có quyền thao tác trên địa chỉ này."
    }
    ```
  * **404 Not Found**: Địa chỉ không tồn tại.
