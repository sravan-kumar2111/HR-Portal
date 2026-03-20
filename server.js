// const UserRoute = require('./app/routes/Routes.js')
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");

// const app = express();
// app.use('/',UserRoute)


// // Body parser middleware
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(bodyParser.json());

// // Database config
// const dbConfig = require("./config/database.config.js");

// // Use native promises
// mongoose.Promise = global.Promise;

// // Connect to MongoDB
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


const UserRoute = require('./app/routes/Routes.js');
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();




const app = express();

// BODY PARSER (must be first)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use('/', UserRoute);
 // Mount admin routes



// Database config
const dbConfig = require("./config/database.config.js");
require("./app/jobs/leaveCron"); // Load the cron job

mongoose.Promise = global.Promise;

mongoose.connect(dbConfig.url)
.then(() => {
    console.log("Database Connected Successfully!!");
})
.catch((err) => {
    console.log("Could not connect to the database", err);
    process.exit(1);
});

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Hello CRUD Node Express" });
});

// Start server
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});

const createAdmin = require("./utils/createAdmin");

app.listen(5000, async () => {
  console.log("Server running...");
  await createAdmin();
});