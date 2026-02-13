const express = require('express');
const router = express.Router();
const db = require('../db');

// steps 3 - 8 within try
router.post("/", async (req, res) => {
  try {
    const {
  firstName,
  lastName,
  dob,
  phone,
  clientId,
  dos,
  tests
} = req.body;

if (
  !firstName ||
  !lastName ||
  !dob ||
  !phone ||
  !clientId ||
  !dos ||
  !Array.isArray(tests) ||
  tests.length === 0
) {
  return res.status(400).json({ error: "Missing required fields" });
}

 // 2️⃣ Normalize input
    const normalized = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      phone: phone.replace(/\D/g, ''),
      clientId: clientId.trim().toUpperCase(),
      dos,
      tests
    };

//3️⃣ Lookup or insert patient
 let patientResult = await db.query(
      `SELECT patient_id FROM patients 
       WHERE first_name=$1 AND last_name=$2 AND dob=$3 AND phone=$4`,
      [normalized.firstName, normalized.lastName, normalized.dob, normalized.phone]
    );

let patientId;

if (patientResult.rows.length > 0) {
  patientId = patientResult.rows[0].patient_id;
} else {
  const newPatient = await db.query(
    `
    INSERT INTO patients (first_name, last_name, dob, phone)
    VALUES ($1, $2, $3, $4)
    RETURNING patient_id
    `,
    [normalized.firstName, normalized.lastName, normalized.dob, normalized.phone]
   );

  patientId = newPatient.rows[0].patient_id;
}

// AFTER patientId is set
// Lookup the integer client ID from the business client code
const clientResult = await db.query(
  `SELECT id FROM clients WHERE clientid = $1`,
  [normalized.clientId]   // still comes from the API request, e.g., "Z000"
);

if (clientResult.rows.length === 0) {
  return res.status(400).json({ error: `Invalid client code: ${clientId}` });
}

const clientIdInt = clientResult.rows[0].id; // this is the integer FK


const accessionNumber = `${normalized.clientId}-${Date.now()}`;
const orderResult = await db.query(
  `
  INSERT INTO orders
    (accession_number, patient_id, client_id, dos)
  VALUES ($1, $2, $3, $4)
  RETURNING id
  `,
  [accessionNumber, patientId, clientIdInt, normalized.dos]
);

const orderId = orderResult.rows[0].id;
console.log('ORDER ID:', orderId);

// Lookup test ID
for (const rawTestId of normalized.tests) {
  const testId = Number(rawTestId);   // convert from string → integer

  if (!Number.isInteger(testId)) {
    return res.status(400).json({ error: `Invalid test ID: ${rawTestId}` });
  }

  await db.query(
    `INSERT INTO order_tests (order_id, test_id)
     VALUES ($1, $2)`,
    [orderId, testId]
  );
}

 res.status(201).json({
      message: 'Patient order created successfully',
      patientId,
      accessionNumber,
      tests: normalized.tests
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//code for search feature
////edited to include pagination
router.get('/', async (req, res) => {
  try {
    // extract query params
    const {
      lastName,
      dob,
      accession,
      page = 1,
      limit = 10
    } = req.query;

    // require at least one filter
    if (!lastName && !dob && !accession) {
      return res.status(400).json({
        error: 'Provide at least lastName, dob, or accession'
      });
    }

    // parse page & limit, enforce safe values
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(parseInt(limit, 10), 50); // safety cap
    const offset = (pageNum - 1) * limitNum;

    let result;

    if (accession) {
      // search by accession number
      result = await db.query(
        `
        SELECT
          p.patient_id,
          p.first_name,
          p.last_name,
          p.dob,
          p.phone,
          o.id AS order_id,
          o.accession_number,
          o.dos,
          c.clientid AS client_code,
          t.test_code,
          t.test_name
        FROM patients p
        JOIN orders o ON o.patient_id = p.patient_id
        LEFT JOIN clients c ON c.id = o.client_id
        LEFT JOIN order_tests ot ON ot.order_id = o.id
        LEFT JOIN tests t ON t.id = ot.test_id
        WHERE o.accession_number = $1
        LIMIT $2 OFFSET $3
        `,
        [accession, limitNum, offset]
      );
    } else {
      // search by lastName and/or dob
      result = await db.query(
        `
        SELECT
          p.patient_id,
          p.first_name,
          p.last_name,
          p.dob,
          p.phone,
          o.id AS order_id,
          o.accession_number,
          o.dos,
          c.clientid AS client_code,
          t.test_code,
          t.test_name
        FROM patients p
        LEFT JOIN orders o ON o.patient_id = p.patient_id
        LEFT JOIN clients c ON c.id = o.client_id
        LEFT JOIN order_tests ot ON ot.order_id = o.id
        LEFT JOIN tests t ON t.id = ot.test_id
        WHERE ($1::text IS NULL OR p.last_name ILIKE $1)
          AND ($2::date IS NULL OR p.dob = $2)
        ORDER BY p.patient_id, o.id
        LIMIT $3 OFFSET $4
        `,
        [lastName ? `%${lastName}%` : null, dob || null, limitNum, offset]
      );
    }

    // shape flat rows into nested JSON
    const patients = {};

    for (const row of result.rows) {
      if (!patients[row.patient_id]) {
        patients[row.patient_id] = {
          patientId: row.patient_id,
          firstName: row.first_name,
          lastName: row.last_name,
          dob: row.dob,
          phone: row.phone,
          orders: []
        };
      }

      if (row.order_id) {
        let order = patients[row.patient_id].orders.find(
          o => o.orderId === row.order_id
        );

        if (!order) {
          order = {
            orderId: row.order_id,
            accessionNumber: row.accession_number,
            dos: row.dos,
            clientCode: row.client_code,
            tests: []
          };
          patients[row.patient_id].orders.push(order);
        }

        if (row.test_code) {
          order.tests.push({
            testCode: row.test_code,
            testName: row.test_name
          });
        }
      }
    }

    // return final response with pagination metadata
    res.json({
      page: pageNum,
      limit: limitNum,
      count: Object.values(patients).length,
      results: Object.values(patients)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;