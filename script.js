const apiBase = "https://lims-app-x9uu.onrender.com";
async function loadTests() {
  const response = await fetch(`${apiBase}/tests`);
  const tests = await response.json();

  const select = document.getElementById("tests");
  select.innerHTML = "";

  tests.forEach(test => {
    const option = document.createElement("option");
    option.value = test.id;
    option.textContent = `${test.test_code} - ${test.test_name}`;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", loadTests);

// ---------- CREATE PATIENT ----------
document.getElementById("patient-form").addEventListener("submit", async (e) => {e.preventDefault();

   const testsSelect = document.getElementById("tests");

const selectedTests = testsSelect
  ? Array.from(testsSelect.selectedOptions)
      .map(opt => opt.value)
      .filter(v => v !== "" && v !== undefined && v !== null)
  : [];


    const data = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      dob: document.getElementById("dob").value,
      phone: document.getElementById("phone").value,
      clientId: document.getElementById("clientId").value,
      dos: document.getElementById("dos").value,
      tests: selectedTests
    };

    try {
      const res = await fetch(`${apiBase}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      document.getElementById("create-patient-result").innerText =
        JSON.stringify(result, null, 2);
    } catch (err) {
      document.getElementById("create-patient-result").innerText =
        "Error creating patient";
      console.error(err);
    }
  });


// ---------- SEARCH PATIENT ----------
let currentPage = 1;

function renderPatients(patients) {
  const container = document.getElementById("search-results");
  container.innerHTML = "";

  if (!patients || !patients.length) {
    container.innerHTML = "<p>No patients found.</p>";
    return;
  }

  patients.forEach(patient => {
    const patientDiv = document.createElement("div");
    patientDiv.classList.add("patient");

    patientDiv.innerHTML = `
      <h3>Patient: ${patient.firstName} ${patient.lastName}</h3>
      <p>DOB: ${patient.dob} | Phone: ${patient.phone}</p>
    `;

    if (patient.orders && patient.orders.length) {
      const ordersList = document.createElement("ul");

      patient.orders.forEach(order => {
        const orderItem = document.createElement("li");

        let testsHTML = "";
        if (order.tests && order.tests.length) {
          testsHTML =
            "<ul>" +
            order.tests
              .map(t => `<li>${t.testCode} - ${t.testName}</li>`)
              .join("") +
            "</ul>";
        }

        orderItem.innerHTML = `
          <strong>Accession:</strong> ${order.accessionNumber}
          | <strong>DOS:</strong> ${order.dos}
          | <strong>Client:</strong> ${order.clientCode}
          ${testsHTML}
        `;

        ordersList.appendChild(orderItem);
      });

      patientDiv.appendChild(ordersList);
    }

    container.appendChild(patientDiv);
  });
}

async function loadPatients(page = 1) {
  const lastName = document.getElementById("search-lastName").value;
  const dob = document.getElementById("search-dob").value;
  const accession = document.getElementById("search-accession").value;

  const params = new URLSearchParams({
    lastName,
    dob,
    accession,
    page
  });

  try {
    const res = await fetch(`${apiBase}/patients?${params.toString()}`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Search failed");
    }

    const data = await res.json();

    currentPage = data.page;
    document.getElementById("current-page").innerText = currentPage;

    // 🔥 THIS is what was missing
    renderPatients(data.results);

  } catch (err) {
    console.error("Search error:", err);
    document.getElementById("search-results").innerText =
      err.message || "Error fetching patients";
  }
}

document.getElementById("search-btn").addEventListener("click", () => loadPatients(1));

document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) loadPatients(currentPage - 1);
});

document.getElementById("next-page").addEventListener("click", () => {
  loadPatients(currentPage + 1);
});
