
// const UserRoute = require('./app/routes/Routes.js');
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();




// const app = express();

// // BODY PARSER (must be first)
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ROUTES
// app.use(cors());
// app.use('/', UserRoute);
//  // Mount admin routes



// // Database config
// const dbConfig = require("./config/database.config.js");
// require("./app/jobs/leaveCron"); // Load the cron job

// mongoose.Promise = global.Promise;

// mongoose.connect(dbConfig.url)
// .then(() => {
//     console.log("Database Connected Successfully!!");
// })
// .catch((err) => {
//     console.log("Could not connect to the database", err);
//     process.exit(1);
// });

// // Test route
// app.get("/", (req, res) => {
//     res.json({ message: "Hello CRUD Node Express" });
// });

// // Start server
// app.listen(3000, () => {
//     console.log("Server is listening on port 3000");
// });

// const createAdmin = require("./utils/createAdmin");

// app.listen(3000, async () => {
//   console.log("Server running...");
//   await createAdmin();
// });




const UserRoute = require('./app/routes/Routes.js');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const createAdmin = require("./utils/createAdmin");
//const autoIdleTracker = require("./utils/autoIdle.js");

const app = express();

// ✅ BODY PARSER FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ CORS
app.use(cors());

// ✅ ROUTES
app.use('/', UserRoute);

// DB config
const dbConfig = require("./config/database.config.js");
require("./app/jobs/leaveCron");

mongoose.Promise = global.Promise;

mongoose.connect(dbConfig.url)
.then(() => {
    console.log("Database Connected Successfully!!");
})
.catch((err) => {
    console.log("DB Error:", err);
    process.exit(1);
});

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Hello CRUD Node Express" });
});

// ✅ ONLY ONE SERVER
const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createAdmin();
});