const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
// 어디서 실행하든 server/.env 를 읽음 (cwd에만 의존하면 CLOUDINARY_* 가 비어 503 발생)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const cloudinaryRoutes = require('./routes/cloudinaryRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

connectDB();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/cart', cartRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Venus API 서버가 실행 중입니다',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      cloudinary: '/api/cloudinary',
      cart: '/api/cart',
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`환경: ${process.env.NODE_ENV}`);
  const cld = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET;
  console.log(cld ? 'Cloudinary: 서명용 환경변수 로드됨' : 'Cloudinary: CLOUDINARY_* 없음 → /api/cloudinary/sign 는 503');
});
