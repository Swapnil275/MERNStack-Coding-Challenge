const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const path = require("path");

const port =  3001;
const app = express();
app.use(cors());

// MongoDB setup
const mongoUri = "mongodb+srv://swapnil275:Swapnil275@swapnilcluster.ckjdn.mongodb.net/?retryWrites=true&w=majority&appName=SwapnilCluster";  // MongoDB URI
const dbName = "transactionsDB";  // Database name
let db;

// MongoDB connection and server initialization
const initializeDBAndServer = async () => {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName); // Connect to the database
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    process.exit(1);
    console.log(`Server is encountering an error while starting: ${error.message}`);
  }
};

initializeDBAndServer();

// Route to get sales data
app.get("/sales", async (request, response) => {
  try {
    const { month = 1, search_q = "", page = 1 } = request.query;
    console.log(request.query);

    const salesCollection = db.collection("transactions");
    
    const filter = {
      dateOfSale: {
        $gte: new Date(`2025-${month}-01`),
        $lt: new Date(`2025-${month + 1}-01`),
      },
      $or: [
        { title: { $regex: search_q, $options: "i" } },
        { price: { $regex: search_q, $options: "i" } },
        { description: { $regex: search_q, $options: "i" } },
      ],
    };

    const transactions = await salesCollection
      .find(filter)
      .skip((page - 1) * 10)
      .limit(10)
      .toArray();

    response.send(transactions);
  } catch (error) {
    response.status(400).json(error.message);
  }
});

// Route to get statistics
app.get("/statistics", async (request, response) => {
  try {
    const { month = 1 } = request.query;
    const salesCollection = db.collection("transactions");

    const pipeline = [
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2025-${month}-01`),
            $lt: new Date(`2025-${month + 1}-01`),
          },
          sold: true,
        },
      },
      {
        $group: {
          _id: null,
          sales: { $sum: "$price" },
          soldItems: { $sum: 1 },
          unSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
          },
        },
      },
    ];

    const stats = await salesCollection.aggregate(pipeline).toArray();
    response.send(stats[0] || {});
  } catch (error) {
    response.status(400).json(error.message);
  }
});

// Route to get item price ranges
app.get("/items", async (request, response) => {
  try {
    const { month } = request.query;
    const salesCollection = db.collection("transactions");

    const pipeline = [
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2025-${month}-01`),
            $lt: new Date(`2025-${month + 1}-01`),
          },
        },
      },
      {
        $group: {
          _id: null,
          "0-100": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 0] }, { $lte: ["$price", 100] }] }, 1, 0] } },
          "101-200": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 101] }, { $lte: ["$price", 200] }] }, 1, 0] } },
          "201-300": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 201] }, { $lte: ["$price", 300] }] }, 1, 0] } },
          "301-400": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 301] }, { $lte: ["$price", 400] }] }, 1, 0] } },
          "401-500": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 401] }, { $lte: ["$price", 500] }] }, 1, 0] } },
          "501-600": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 501] }, { $lte: ["$price", 600] }] }, 1, 0] } },
          "601-700": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 601] }, { $lte: ["$price", 700] }] }, 1, 0] } },
          "701-800": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 701] }, { $lte: ["$price", 800] }] }, 1, 0] } },
          "801-900": { $sum: { $cond: [{ $and: [{ $gte: ["$price", 801] }, { $lte: ["$price", 900] }] }, 1, 0] } },
          "901-above": { $sum: { $cond: [{ $gte: ["$price", 901] }, 1, 0] } },
        },
      },
    ];

    const dbResponse = await salesCollection.aggregate(pipeline).toArray();
    response.status(200).json(dbResponse[0]);
  } catch (error) {
    response.status(400).json(error.message);
  }
});

// Route to get categories
app.get("/categories", async (request, response) => {
  try {
    const { month = 1 } = request.query;
    const salesCollection = db.collection("transactions");

    const pipeline = [
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2025-${month}-01`),
            $lt: new Date(`2025-${month + 1}-01`),
          },
        },
      },
      {
        $group: {
          _id: "$category",
          items: { $sum: 1 },
        },
      },
    ];

    const dbResponse = await salesCollection.aggregate(pipeline).toArray();
    response.status(200).json(dbResponse);
  } catch (error) {
    response.status(400).json(error.message);
  }
});

const monthsData = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

// Route to get all statistics
app.get("/all-statistics", async (request, response) => {
  try {
    const { month = 3 } = request.query;

    // API calls for statistics, item ranges, and categories
    const api1Response = await fetch(
      `https://backendof.onrender.com/statistics?month=${month}`
    );
    const api1Data = await api1Response.json();

    const api2Response = await fetch(
      `https://backendof.onrender.com/items?month=${month}`
    );
    const api2Data = await api2Response.json();

    const api3Response = await fetch(
      `https://backendof.onrender.com/categories?month=${month}`
    );
    const api3Data = await api3Response.json();

    response.status(200).json({
      monthName: monthsData[month],
      statistics: api1Data,
      itemPriceRange: api2Data,
      categories: api3Data,
    });
  } catch (error) {
    response.status(400).json(error.message);
  }
});
