import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/api/v1/health`);
  console.log(`=================================`);
});
