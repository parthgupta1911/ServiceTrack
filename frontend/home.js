document.addEventListener("DOMContentLoaded", () => {
  const token = getCookie("token");
  if (!token) {
    alert("No authentication token found. Redirecting to login page.");
    window.location.href = "login.html"; // Replace with the actual login page URL
    return;
  }

  validateJwt(token);
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

async function validateJwt(token) {
  try {
    const response = await fetch("http://localhost:5000/api/user/validateJwt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (response.ok) {
      let user = data.user;
      if (user.role != "mechanic") {
        displayUserInfo(data.user);
      } else {
        document.getElementById("mech-box").classList.remove("hidden");
        document.getElementById("other").classList.add("hidden");

        try {
          const response = await fetch(
            "http://localhost:5000/api/user/getService",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch services");
          }

          const data = await response.json();
          displayServices(data.services);
        } catch (error) {
          console.error("Error fetching services:", error);
          alert("Failed to fetch services. Redirecting to login page.");
          window.location.href = "login.html";
        }
      }
    } else {
      alert(
        data.message || "Failed to validate token. Redirecting to login page."
      );
      window.location.href = "login.html";
    }
  } catch (error) {
    alert("Error: " + error.message);
    window.location.href = "login.html"; // Replace with the actual login page URL
  }
}

function displayUserInfo(user) {
  ur = user.role;
  const userInfoDiv = document.getElementById("user-info");
  if (user.role === "admin") {
    userInfoDiv.innerHTML = `
      <h2>Welcome, ${user.name}</h2>
        <button id="go-back-btn" class="go-back-btn btn hidden" onclick="toggleMechanicForm()">
     Go Back
      </button>
      <button id="add-mechanic-btn" class="add-mechanic-btn btn" onclick="toggleMechanicForm()">
        Add Mechanic
      </button>
  
       <div class="container">
    <form id="mechanic-form" class="form-container hidden" onsubmit="addMechanic(event)">
      <h2>Mechanic details</h2>
      <input
        type="text"
        id="mechName"
        name="mechName"
        placeholder="Mechanic Name"
        required
      />
      <input
        type="email"
        id="mechEmail"
        name="mechEmail"
        placeholder="Mechanic Email"
        required
      />
      <button class="btn" type="submit">Save details</button>
    </form>
  </div>
    `;
  } else if (user.role === "user") {
    userInfoDiv.innerHTML = `
      <h2>Welcome, ${user.name}</h2>
       <div class="container">
      <button id="go-back-btn-user" class=" btn hidden" onclick="toggleUser()">
     Go Back
      </button>
      <button id="reg-vech" class="btn" onclick="toggleRegisterVech()">
        Register A Veichle
      </button>
      <button id="schedule-service" class=" btn" onclick="toggleService()">
        Schedule A Service
      </button>
      </div>
      <div id="reg-vech-form" class="container hidden">
    <div class="form-container">
      <h2>Add Vehicle</h2>
      <form id="vehicle-form" onsubmit="addVeichle(event)">
       <select id="type" name="type" required>
          <option value="" disabled selected>Select Vehicle Type</option>
          <option value="2 wheller">2 Wheeler</option>
          <option value="4 wheller">4 Wheeler</option>
        </select>
        <input type="text" id="make" name="make" placeholder="Vehicle Make" required>
        <input type="text" id="model" name="model" placeholder="Vehicle Model" required>
        <input type="number" id="year" name="year" placeholder="Vehicle Year" required>
        <input type="text" id="registrationNumber" name="registrationNumber" placeholder="Registration Number" required>
        <input type="date" id="lastService" name="lastService" placeholder="Last Service Date" required>
        <button type="submit">Save details</button>
      </form>
    </div>
  </div>
  <div id="form-service" class="hidden container">
    <div class="form-container">
      <h2>Schedule a Service</h2>
      <form id="service-form" onsubmit="scheduleService(event)">
        
        <input type="text" id="registrationNumber2" name="registrationNumber" placeholder="Registration Number" required>

        <input type="date" id="serviceDate" name="date" required>
        <select id="serviceTime" name="time" required>
          <option value="">Select Service Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
        <button type="submit">Schedule Service</button>
      </form>
    </div>
  </div>
    `;
  }
}

function displayServices(services) {
  const mechBox = document.getElementById("mech-box");
  const serviceList = document.createElement("div");
  serviceList.classList.add("container");

  if (services.length === 0) {
    serviceList.innerHTML = "<p>No services scheduled for today.</p>";
    mechBox.appendChild(serviceList);
    return;
  }

  const table = document.createElement("table");
  table.classList.add("service-table");

  // Create table header
  const headerRow = table.insertRow();
  headerRow.innerHTML = `
    <th>Owner Name</th>
    <th>Owner Email</th>
    <th>Registration Number</th>
    <th>Time</th>
    <th>Action</th>
  `;

  // Populate table rows with service data
  services.forEach((service) => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>${service.ownerName}</td>
      <td>${service.ownerEmail}</td>
      <td>${service.registrationNumber}</td>
      <td>${service.time}</td>
      <td><button class="btn" onclick="markAsDone('${service._id}', '${service.registrationNumber}')">Mark as Done</button></td>
    `;
  });

  serviceList.appendChild(table);
  mechBox.appendChild(serviceList);
}

function markAsDone(id) {
  const token = getCookie("token");

  fetch("http://localhost:5000/api/user/markasdone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serviceId: id, token }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to mark service as done");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Service marked as done successfully:", data);
      location.reload();
    })
    .catch((error) => {
      console.error("Error marking service as done:", error);
      alert("Failed to mark service as done. Please try again.");
    });
}
async function scheduleService(event) {
  event.preventDefault();

  const token = getCookie("token");
  const registrationNumber = document.getElementById(
    "registrationNumber2"
  ).value;
  const serviceDate = document.getElementById("serviceDate").value;
  const serviceTime = document.getElementById("serviceTime").value;

  try {
    const response = await fetch("http://localhost:5000/api/user/addService", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        registrationNumber,
        date: serviceDate,
        time: serviceTime,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to schedule service");
    }

    const data = await response.json();
    alert("Service scheduled successfully");
    location.reload();
  } catch (error) {
    console.error("Error scheduling service:", error);
    alert(error.message || "Failed to schedule service");
    location.reload();
  }
}
function toggleUser() {
  const regVechForm = document.getElementById("reg-vech-form");

  if (!regVechForm.classList.contains("hidden")) {
    regVechForm.classList.add("hidden");
  }
  const serviceForm = document.getElementById("form-service");

  if (!serviceForm.classList.contains("hidden")) {
    serviceForm.classList.add("hidden");
  }
  document.getElementById("reg-vech").classList.toggle("hidden");
  document.getElementById("schedule-service").classList.toggle("hidden");
  document.getElementById("go-back-btn-user").classList.toggle("hidden");
}
function toggleRegisterVech() {
  document.getElementById("reg-vech-form").classList.toggle("hidden");
  document.getElementById("reg-vech").classList.toggle("hidden");
  document.getElementById("schedule-service").classList.toggle("hidden");
  document.getElementById("go-back-btn-user").classList.toggle("hidden");
}
async function toggleService() {
  document.getElementById("form-service").classList.toggle("hidden");
  await populateRegistrationNumbers();
  document.getElementById("reg-vech").classList.toggle("hidden");
  document.getElementById("schedule-service").classList.toggle("hidden");
  document.getElementById("go-back-btn-user").classList.toggle("hidden");
}
function toggleMechanicForm() {
  const mechanicForm = document.getElementById("mechanic-form");
  const goBackbtn = document.getElementById("go-back-btn");
  const addmechbtn = document.getElementById("add-mechanic-btn");
  mechanicForm.classList.toggle("hidden");
  goBackbtn.classList.toggle("hidden");
  addmechbtn.classList.toggle("hidden");
}

async function addVeichle(event) {
  event.preventDefault();
  console.log(12);
  const token = getCookie("token");
  const type = document.getElementById("type").value;
  const make = document.getElementById("make").value;
  const model = document.getElementById("model").value;
  const year = document.getElementById("year").value;
  const registrationNumber =
    document.getElementById("registrationNumber").value;
  const lastService = document.getElementById("lastService").value;

  try {
    const response = await fetch("http://localhost:5000/api/user/addVech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        type,
        make,
        model,
        year,
        registrationNumber,
        lastService,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.message || "Failed to add vehicle");
      throw new Error(data.message || "Failed to add vehicle");
    }

    alert("Vehicle added successfully");
    location.reload();
  } catch (error) {
    console.error("Error adding vehicle:", error);
    alert(error.message || "Failed to add vehicle");
    location.reload();
  }
}
async function addMechanic(event) {
  event.preventDefault();

  const token = getCookie("token");
  const mechName = document.getElementById("mechName").value;
  const mechEmail = document.getElementById("mechEmail").value;

  try {
    const response = await fetch("http://localhost:5000/api/user/addMech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        mechName,
        mechEmail,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.message || "Failed to add mechanic");
      throw new Error(data.message || "Failed to add mechanic");
    }

    alert("Mechanic added successfully");
    location.reload();
  } catch (error) {
    console.error("Error adding mechanic:", error);
    alert(error.message || "Failed to add mechanic");
    location.reload();
  }
}
