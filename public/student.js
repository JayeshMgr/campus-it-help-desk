
function displayStudentInfo(token) {

}

function createTicketControls(ticket, ticketItem, token) {

  // Display existing comments
  const commentsHeading = document.createElement("h4");
  commentsHeading.textContent = "Comments";
  ticketItem.appendChild(commentsHeading);

  if (ticket.comments && ticket.comments.length > 0) {
    ticket.comments.forEach((comment) => {
      const commentElement = document.createElement("p");

      // If comments are objects, get their text property.
      // If they are strings, display the string directly.
     if (typeof comment === "string") {
  commentElement.textContent = comment;
} else {
  const author = comment.authorRole
    ? `${comment.authorRole}: `
    : "";

  const label = comment.type === "resolution"
    ? "[Resolution] "
    : "";

  commentElement.textContent =
    `${label}${author}${comment.text}`;
}
      ticketItem.appendChild(commentElement);
    });
  } else {
    const noComments = document.createElement("p");
    noComments.textContent = "No comments yet.";
    ticketItem.appendChild(noComments);
  }

  // Do not show controls for closed tickets
  if (ticket.status === "Closed") {
    return;
  }

  // Create area for comment input
  const commentInput = document.createElement("textarea");
  commentInput.placeholder = "Enter a comment or dispute open status";
  commentInput.rows = 3;
  commentInput.maxLength = 2000;

  // Add Comment button
  const addCommentButton = document.createElement("button");
  addCommentButton.textContent = "Add Comment";

  addCommentButton.addEventListener("click", async () => {
    const comment = commentInput.value.trim();

    if (!comment) {
      alert("Please enter a comment.");
      return;
    }

    await updateTicket(
      ticket._id,
      "/comments",
      { comment },
      token
    );
  });



  ticketItem.append(
    commentInput,
    addCommentButton
  );
}

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
      createTicketControls(request, requestItem, token);
      requestList.appendChild(requestItem);
    });
  } catch (error) {
    requestList.textContent = "Error loading IT requests.";
    console.error(error);
  }
}

async function updateTicket(ticketId, action, data, token) {
  try {
    // Comments use POST; closing a ticket uses PATCH.
    const method = action === "/comments" ? "POST" : "PATCH";

    const response = await fetch(
      `/api/tickets/${ticketId}${action}`,
      {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Ticket update failed:", result);
      alert(result.message || "Failed to update ticket.");
      return;
    }

    alert(
      action === "/comments"
        ? "Comment added successfully."
        : "Ticket closed successfully."
    );

    // Reload the tickets so the new comment or status appears.
    await loadITRequests();
  } catch (error) {
    console.error("Error updating ticket:", error);
    alert("An error occurred while updating the ticket.");
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



