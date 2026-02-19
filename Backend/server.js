// to excess keys of .env
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/db/db");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

connectDB();

app.listen(3001, () => {
  console.log("server is running on port 3001");
});

module.exports = app;
