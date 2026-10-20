
async function loadITRequests() {
  const requestList = document.getElementById("request-list");
  const token = sessionStorage.getItem("token");

  try {
    // Get all IT requests from the server
    const response = await fetch("/api/tickets/mine", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch IT requests");
    }

    /*const requests = await response.json();

    // Find requests belonging to this student
    const studentRequests = requests.filter(
      (request) => request.studentId === token
    );
*/
    const studentRequests = await response.json();
    // Clear the existing list
    requestList.textContent = "";

    // Display a message if no requests match
    if (studentRequests.length === 0) {
      requestList.textContent = "no IT requests found";
      return;
    }

    // Display each matching IT request
    studentRequests.forEach((request) => {
      const requestItem = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = request.title;

      const category = document.createElement("p");
      category.textContent = `Category: ${request.category}`;

      const description = document.createElement("p");
      description.textContent = `Description: ${request.description}`;

      const status = document.createElement("p");
      status.textContent = `Status: ${request.status}`;

      requestItem.append(title, category, description, status);
      requestList.appendChild(requestItem);
    });
  } catch (error) {
    requestList.textContent = "Error loading IT requests.";
    console.error(error);
  }
}

async function logout() {
  // Clear the session storage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  // Redirect to the login page
  window.location.href = "login.html";
}

loadITRequests();



