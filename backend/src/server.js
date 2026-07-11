const app = require('./app');
const { sequelize } = require('./models');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database schemas
    // For local sqlite execution, basic sync is stable and safe.
    await sequelize.sync();
    console.log('All database models synchronized successfully.');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server due to database error:', error);
    process.exit(1);
  }
};

startServer();
