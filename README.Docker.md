# Docker Deploy

## File da them

- `Dockerfile`: build image cho backend Node.js.
- `docker-compose.yml`: chay cung luc API va MySQL.
- `.env.example`: mau bien moi truong de tao file `.env`.
- `.dockerignore`: giam kich thuoc build context.

## Cach chay

1. Tao file `.env` tu `.env.example`.
2. Cap nhat lai cac gia tri nhay cam nhu `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`, `GOOGLE_CLIENT_ID`.
3. Chay lenh:

```bash
docker compose up -d --build
```

4. Xem log backend:

```bash
docker compose logs -f app
```

5. Dung he thong:

```bash
docker compose down
```

## Luu y

- API duoc public qua cong `PORT` trong file `.env`, mac dinh la `8080`.
- MySQL dung volume `mysql_data`, upload anh dung volume `uploads_data`.
- CSDL chi duoc tao container va database rong. Neu project can schema/seed data, ban can import SQL hoac chay migration rieng.
