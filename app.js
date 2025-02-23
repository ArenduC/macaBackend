const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { json } = require("react-router-dom");
const app = express();
const dayjs = require("dayjs");
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./storage");
const admin = require("firebase-admin");
const { format, utcToZonedTime } = require("date-fns-tz");
const moment = require("moment-timezone");
const date = new Date();
const timeZone = "Asia/Kolkata";

var parser = require("body-parser");

app.use(express.json());
app.use(cors());
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "",
  database: "mess_organigation",
  timezone: "+05:30",
});

const pool = mysql.createPool({
  user: "root",
  host: "localhost",
  password: "",
  database: "mess_organigation",
  waitForConnections: true, // Replace with your database name
});

admin.initializeApp({
  credential: admin.credential.cert(
    require("./maca-cf502-firebase-adminsdk-plf9j-3d0cffff86.json")
  ),
});

const baseUrl = "/maca/v1";
const registrationTokens = [
  "elyx-u-3Rrm_8Qoy5AqJo8:APA91bE_j6aw_RICmkUR9gmkFRe7SS1wkcgFasZ-DTUBy02ibWesJWQwKNPJgisXX3Ij7U5bXmQn8IjGXw6whUZRv9yxkAsuqrhqFL6dkMGXOMLLer83_9Q",
  // …
];

const message = {
  notification: {
    title: "$FooCorp up 1.43% on the day",
    body: "$FooCorp gained 11.80 points to close at 835.67, up 1.43% on the day.",
  },
};

const multiMessageSend = async (data) => {
  const payload = {
    tokens: data,
    notification: {
      title: "Hello!",
      body: "This is a test notification.",
    },
    data: {
      key1: "value1",
      key2: "value2",
    },
  };

  console.log("notificationPayload", payload);

  // Send a message to the devices corresponding to the provided
  // registration tokens.\

  admin
    .messaging()
    .sendEachForMulticast(payload)
    .then((response) => {
      // See the MessagingDevicesResponse reference documentation for
      // the contents of response.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

const individualMessageSend = async (data) => {
  const payload = {
    tokens: data.registrationTokens,
    notification: {
      title: "Hello!",
      body: "This is a test notification.",
    },
    data: {
      key1: "value1",
      key2: "value2",
    },
  };

  // Send a message to the devices corresponding to the provided
  // registration tokens.\

  admin
    .messaging()
    .send(payload)
    .then((response) => {
      // See the MessagingDevicesResponse reference documentation for
      // the contents of response.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

const responseReturn = (res, result, err) => {
  if (err) {
    res.status(400).send({
      message: "An error occurred",
      status: 400,
      isSuccess: false,
      data: null,
    });
  } else if (result) {
    res.status(200).send({
      message: "Data retrieved successfully",
      status: 200,
      isSuccess: true,
      data: result,
    });
    console.log("result");
  } else {
    res.status(404).send({
      message: "No data found",
      status: 404,
      isSuccess: false,
      data: [],
    });
  }
};

app.get(`${baseUrl}/notificationSend`, async (req, res) => {
  var multiRegistrationToken = [];

  db.query("SELECT * FROM user_accesstoken", async (err, result) => {
    console.log("multiUserToken", result);
    for (let i = 0; i < result.length; i++) {
      console.log(`Iteration: ${result[i]["accessToken"]}`);
      multiRegistrationToken.push(result[i]["accessToken"]);
    }
    console.log("tokens", multiRegistrationToken);
    // Pass `res` as the first argument

    try {
      // Send the message and get the result
      const result = await multiMessageSend(multiRegistrationToken);

      // Send the response using the responseReturn function
      responseReturn(res, result, null); // No error, just the result
    } catch (error) {
      // Handle any error that occurs during the message sending process
      console.log(error); // Pass error to responseReturn function
    }
  });
});

app.get(`${baseUrl}/borderlist`, (req, res) => {
  db.query("SELECT * FROM user", (err, result) => {
    responseReturn(res, result, err); // Pass `res` as the first argument
  });
});

app.post(`${baseUrl}/user_marketing`, (req, res) => {
  let marketing_amount = req.body.marketing_amount;
  let user_id = req.body.user_id;
  let created_date = new Date();

  db.query(
    "INSERT INTO user_marketig_master(marketing_amount,user_id,created_date) values(?,?,?)",
    [marketing_amount, user_id, created_date],
    (err, result, field) => {
      if (err) {
        return res.send({ success: false, message: "somthing is wrong...." });
      } else {
        db.query("select * from user_marketig_master", (err, result, feild) => {
          responseReturn(res, result, err);
        });
      }
    }
  );
});

app.post(`${baseUrl}/user_deposite`, (req, res) => {
  console.log("Request Body:", req.body);
  let user_id = req.body.user_id;
  let manager_id = req.body.manager_id;
  let user_deposite_amount = req.body.user_deposite_amount;
  let user_deposite_date = new Date();

  db.query(
    "INSERT INTO user_deposite_master(user_id, manager_id, user_deposite_amount, user_deposite_date) values(?,?,?,?)",
    [user_id, manager_id, user_deposite_amount, user_deposite_date],
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.post(`${baseUrl}/electric_bill`, (req, res) => {
  console.log("Request Body:", req.body);
  let electric_bill = req.body.electric_bill;
  let manager_id = req.body.manager_id;
  let electric_unit = req.body.electric_unit;
  let internet_bill = req.body.internet_bill;
  let created_date = new Date();

  db.query(
    "INSERT INTO maca_electric_bill(manager_id, electric_bill, electric_unit, internet_bill, created_date) values(?,?,?,?,?)",
    [manager_id, electric_bill, electric_unit, internet_bill, created_date],
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.get(`${baseUrl}/bed_available`, (req, res) => {
  db.query(
    "SELECT user_bed_master.user_bed, user_bed_master.id FROM user_bed_master LEFT JOIN user ON user_bed_master.id = user.user_bed_id WHERE user.user_bed_id IS NULL;",
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.post(`${baseUrl}/user_login`, (req, res) => {
  let password = req.body.password;
  let email = req.body.email;
  let accessToken = req.body.accessToken;
  db.query(
    'select user.id, user.name, user_type_master.user_type, user_bed_master.user_bed, addres_master.city, IFNULL(sum(user_marketig_master.marketing_amount), "Pending") as Total_Marketing from user inner join addres_master on user.city_id = addres_master.id inner join user_type_master on user.user_type_id = user_type_master.id LEFT join user_marketig_master on user_marketig_master.user_id = user.id inner join user_bed_master on user_bed_master.id = user.user_bed_id where user.email = ? AND user.password = ?;',
    [email, password],
    (err, result, field) => {
      responseReturn(res, result, err);
      console.log(result[0]["id"]);
      const borderId = result[0]["id"];
      db.query(
        `SELECT EXISTS(SELECT 1 FROM user_accesstoken WHERE borderId = ?) AS result`,
        [borderId],
        (err, queryResult) => {
          if (err) {
            console.error("Database query error:", err);
            return;
          }

          console.log(queryResult[0]?.result);
          if (queryResult[0]?.result === 1) {
            db.query(
              "UPDATE user_accesstoken SET accessToken = ? WHERE borderId = ?",

              [accessToken, borderId]
            );
          } else {
            db.query(
              "INSERT INTO user_accesstoken (borderId, accessToken) SELECT ?, ? FROM user WHERE user.id = ?",
              [borderId, accessToken, borderId]
            );
          }
          // Access the result here
        }
      );
    }
  );
});

app.post(`${baseUrl}/set_marketing_shift`, (req, res) => {
  console.log(req.body.startDate);

  let borderId = req.body.borderId;
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;
  let startShift = req.body.startShift;
  let endShift = req.body.endShift;
  let created_date = new Date();

  // Convert the start and end dates from UTC to IST (Indian Standard Time)
  startDate = moment
    .tz(startDate, "Asia/Kolkata")
    .format("YYYY-MM-DD HH:mm:ss");
  endDate = moment.tz(endDate, "Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Log the adjusted dates
  console.log("Converted startDate (IST):", startDate);
  console.log("Converted endDate (IST):", endDate);

  // Prepare the JSON body for debugging
  var jsonBody = { startDate, endDate };
  console.log(jsonBody);

  // Insert the data into the database
  db.query(
    "INSERT INTO marketing_shifts (borderId, createdDate, startDate, endDate, endShift, startShift) VALUES (?, ?, ?, ?, ?, ?)",
    [borderId, created_date, startDate, endDate, endShift, startShift],
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.post(`${baseUrl}/get_individual_marketing_status`, (req, res) => {
  let user_id = req.body.user_id;

  db.query(
    ` SELECT 
    user.id AS user_id,
    user.name AS marketing_user,
    CONVERT_TZ(latest_shifts.startDate, '+00:00', '+05:30') AS startDate,
    CONVERT_TZ(latest_shifts.endDate, '+00:00', '+05:30') AS endDate,
    CONVERT_TZ(latest_shifts.startShift, '+00:00', '+05:30') AS startShift,
    CONVERT_TZ(latest_shifts.endShift, '+00:00', '+05:30') AS endShift,
    CASE
        WHEN latest_shifts.startDate IS NULL THEN 0
        WHEN CURRENT_DATE BETWEEN CONVERT_TZ(latest_shifts.startDate, '+00:00', '+05:30') 
                              AND CONVERT_TZ(latest_shifts.endDate, '+00:00', '+05:30') THEN 1
        WHEN CURRENT_DATE < CONVERT_TZ(latest_shifts.startDate, '+00:00', '+05:30') THEN 2
        WHEN CURRENT_DATE > CONVERT_TZ(latest_shifts.endDate, '+00:00', '+05:30') THEN 3
    END AS status
FROM 
    user
LEFT JOIN 
    (SELECT 
         ms1.borderId,
         ms1.startDate,
         ms1.endDate,
         ms1.startShift,
         ms1.endShift
     FROM 
         marketing_shifts AS ms1
     WHERE 
         ms1.endDate = (SELECT MAX(ms2.endDate) 
                        FROM marketing_shifts AS ms2 
                        WHERE ms1.borderId = ms2.borderId)
         AND MONTH(ms1.createdDate) = MONTH(CURRENT_DATE)
         AND YEAR(ms1.createdDate) = YEAR(CURRENT_DATE)
    ) AS latest_shifts
ON 
    user.id = latest_shifts.borderId
WHERE 
    user.id = ?; `,
    [user_id],
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.get(`${baseUrl}/get_marketing_status`, (req, res) => {
  db.query(
    `
   SELECT 
    user.id AS user_id,
    user.name AS marketing_user,
    CONVERT_TZ(latest_shifts.startDate, '+00:00', '+05:30') AS startDate,
    CONVERT_TZ(latest_shifts.endDate, '+00:00', '+05:30') AS endDate,
    CONVERT_TZ(latest_shifts.startShift, '+00:00', '+05:30') AS startShift,
    CONVERT_TZ(latest_shifts.endShift, '+00:00', '+05:30') AS endShift,
    CASE
        WHEN latest_shifts.startDate IS NULL THEN 0
        WHEN CURRENT_DATE BETWEEN (latest_shifts.startDate) 
                              AND (latest_shifts.endDate) THEN 1
        WHEN CURRENT_DATE < (latest_shifts.startDate) THEN 2
        WHEN CURRENT_DATE > (latest_shifts.endDate) THEN 3
    END AS status
    FROM 
        \`user\`
    LEFT JOIN 
        (SELECT 
             ms1.borderId,
             ms1.startDate,
             ms1.endDate,
             ms1.startShift,
             ms1.endShift
         FROM 
             marketing_shifts AS ms1
         WHERE 
             ms1.endDate = (SELECT MAX(ms2.endDate) 
                            FROM marketing_shifts AS ms2 
                            WHERE ms1.borderId = ms2.borderId)
             AND MONTH(ms1.createdDate) = MONTH(CURRENT_DATE)
             AND YEAR(ms1.createdDate) = YEAR(CURRENT_DATE)
        ) AS latest_shifts
    ON 
        \`user\`.id = latest_shifts.borderId
    WHERE 
        \`user\`.user_status = 1`,
    (err, result, field) => {
      responseReturn(res, result, err);
      console.log("data", result);
    }
  );
});

app.post(`${baseUrl}/add_expense`, (req, res) => {
  let marketing_amount = req.body.marketing_amount;
  let item = req.body.item;
  let user_id = req.body.user_id;
  let created_date = new Date();

  db.query(
    "INSERT INTO user_marketig_master(marketing_amount,user_id,created_date, item) values(?,?,?,?)",
    [marketing_amount, user_id, created_date, item],
    (err, result, field) => {
      responseReturn(res, result, err);
    }
  );
});

app.post(`${baseUrl}/user_type_change`, (req, res) => {
  let user_id = req.body.user_id;
  let user_type_id = 1;
  let created_by_id = req.body.created_by_id;
  let created_date = new Date();

  db.query(
    "UPDATE user SET user_type_id = 2 WHERE user_type_id = 1",
    [user_type_id],
    (err, result, field) => {}
  );
  db.query(
    "UPDATE user SET user_type_id = 1 WHERE id = ?",
    [user_id],
    (err, result, field) => {
      db.query(
        `INSERT INTO your_table_name (user_id, user_type_id, created_by_id, created_date) 
         VALUES (?, ?, ?, ?);`,
        [user_id, user_type_id, created_by_id, created_date],
        (err, result, field) => {
          responseReturn(res, result, err);
        }
      );
    }
  );
});

app.get(`${baseUrl}/current_marketing_details`, async (req, res) => {
  const query = "CALL GetMarketingShifts()";

  db.query(query, (error, result) => {
    responseReturn(res, result[0], error);
  });
});

app.get("/", (req, res) => {
  return res.send({
    success: true,
    message: "hello i am node sql.....",
  });
});

app.listen(3000, () => {
  console.log("running server");
});
