const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/** 로컬 개발용 기본값 */
const LOCAL_MONGO_DEFAULT = 'mongodb://127.0.0.1:27017/shoppingmall';

function resolveMongoTargets() {
  // 요청사항: MONGO_URI(원격)를 기본으로 시도하고, 실패할 때만 로컬로 폴백
  const mongoUri = process.env.MONGO_URI?.trim();
  const atlasUri = process.env.MONGODB_ATLAS_URI?.trim();
  const primary = mongoUri || atlasUri;
  const primarySource = mongoUri ? 'MONGO_URI' : 'MONGODB_ATLAS_URI';
  const local = process.env.MONGO_LOCAL_URI?.trim() || LOCAL_MONGO_DEFAULT;

  if (primary) {
    return {
      primary: { uri: primary, source: primarySource },
      fallback: { uri: local, source: 'MONGO_LOCAL_URI/로컬 기본값' },
    };
  }

  return {
    primary: { uri: local, source: 'MONGO_LOCAL_URI/로컬 기본값' },
    fallback: null,
  };
}

const connectDB = async () => {
  try {
    const { primary } = resolveMongoTargets();
    const conn = await mongoose.connect(primary.uri);
    console.log(`MongoDB 연결 성공 [${primary.source}]: ${conn.connection.host}`);
  } catch (error) {
    const { fallback } = resolveMongoTargets();
    if (!fallback) {
      console.error(`MongoDB 연결 실패: ${error.message}`);
      process.exit(1);
    }

    console.error(`기본 MongoDB 연결 실패, 로컬로 재시도합니다: ${error.message}`);

    try {
      const conn = await mongoose.connect(fallback.uri);
      console.log(`MongoDB 로컬 폴백 연결 성공 [${fallback.source}]: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`MongoDB 로컬 폴백 연결 실패: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
