

function createTicketControls(ticket, ticketItem, token) {

  // Display existing comments
  const commentsHeading = document.createElement("h4");
  commentsHeading.textContent = "Comments";
  ticketItem.appendChild(commentsHeading);

  if (ticket.comments && ticket.comments.length > 0) {
    ticket.comments.forEach((comment) => {
      const commentElement = document.createElement("div");
      commentElement.className = "student-comment";

      // If comments are objects, get their text property.
      // If they are strings, display the string directly.
     if (typeof comment === "string") {
  commentElement.textContent = comment;
} else {
  // Classes let the CSS color staff/student and resolution/reopen comments.
  if (comment.authorRole) {
    commentElement.classList.add(`comment-${comment.authorRole}`);
  }

    let label = "";

  if (comment.type === "resolution") {
    label = "Resolution";
    commentElement.classList.add("comment-resolution");
  } else if (comment.type === "reopen") {
    label = "Reopening Explanation";
    commentElement.classList.add("comment-reopen");
  }

  const commentHeader = document.createElement("p");
  commentHeader.className = "comment-author";
  commentHeader.textContent = comment.authorRole || "Unknown";

  if (label) {
    const typeLabel = document.createElement("span");
    typeLabel.className = "comment-type";
    typeLabel.textContent = label;
    commentHeader.appendChild(typeLabel);
  }

  const commentText = document.createElement("p");
  commentText.className = "comment-text";
  commentText.textContent = comment.text;

  commentElement.append(commentHeader, commentText);
}
      ticketItem.appendChild(commentElement);
    });
  } else {
    const noComments = document.createElement("p");
    noComments.className = "no-comments";
    noComments.textContent = "No comments yet.";
    ticketItem.appendChild(noComments);
  }

  // Wrapper so the textarea and button line up together
  const controls = document.createElement("div");
  controls.className = "student-ticket-controls";

  // Do not show controls for closed tickets
 // Closed tickets get a Reopen Ticket form.
if (ticket.status === "Closed") {
  const reopenHeading = document.createElement("h4");
  reopenHeading.textContent = "Reopen Ticket";

  const reopenExplanation = document.createElement("textarea");
  reopenExplanation.placeholder =
    "Explain why this ticket needs to be reopened...";
  reopenExplanation.rows = 3;
  reopenExplanation.maxLength = 2000;

  const reopenButton = document.createElement("button");
  reopenButton.textContent = "Reopen Ticket";

  reopenButton.addEventListener("click", async () => {
    const comment = reopenExplanation.value.trim();

    if (!comment) {
      alert("Please explain why this ticket needs to be reopened.");
      return;
    }

    await updateTicket(
      ticket._id,
      "/reopen",
      { comment },
      token
    );
  });

  controls.append(
    reopenHeading,
    reopenExplanation,
    reopenButton
  );
  ticketItem.appendChild(controls);

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



  controls.append(
    commentInput,
    addCommentButton
  );
  ticketItem.appendChild(controls);
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
      requestItem.className = "student-ticket";

      // Title and status badge share one row at the top of the card
      const ticketHeader = document.createElement("div");
      ticketHeader.className = "student-ticket-header";

      const title = document.createElement("h3");
      title.textContent = request.title;

      // e.g. "In Progress" -> "status-in-progress"
      const status = document.createElement("span");
      const statusClass = request.status.toLowerCase().replace(" ", "-");
      status.className = `status-badge status-${statusClass}`;
      status.textContent = request.status;

      ticketHeader.append(title, status);

      const category = document.createElement("p");
      category.className = "student-ticket-detail";
      const categoryLabel = document.createElement("strong");
      categoryLabel.textContent = "Category: ";
      category.append(categoryLabel, request.category);

      const description = document.createElement("p");
      description.className = "student-ticket-detail";
      const descriptionLabel = document.createElement("strong");
      descriptionLabel.textContent = "Description: ";
      description.append(descriptionLabel, request.description);

      requestItem.append(ticketHeader, category, description);
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

  if (action === "/comments") {
  alert("Comment added successfully.");
} else if (action === "/reopen") {
  alert("Ticket reopened successfully.");
} else {
  alert("Ticket closed successfully.");
}
    // Reload the tickets so the new comment or status appears.
    await loadITRequests();
  } catch (error) {
    console.error("Error updating ticket:", error);
    alert("An error occurred while updating the ticket.");
  }
}

// Student Ticket Submission
// Runs when the student clicks "Submit Ticket" on the form in student.html.
// Sends the new ticket to the backend (POST /api/tickets) and then
async function submitTicket(event) {
  event.preventDefault();

  // Get the form and the values the student typed in.
  const form = document.getElementById("ticket-form");
  const title = document.getElementById("ticket-title").value.trim();
  const category = document.getElementById("ticket-category").value.trim();
  const description = document.getElementById("ticket-description").value.trim();

  if (!title || !category || !description) {
    alert("Please fill in the title, category, and description.");
    return;
  }

  // The JWT is saved in sessionStorage by login.js when the student logs in.
  // The backend needs it to know which student is creating the ticket.
  const token = sessionStorage.getItem("token");

  try {
    // Send the new ticket to the server.
    // The backend only allows logged-in students to use this route.
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // The backend expects { title, category, description }.
      // studentId is NOT sent here; the server takes it from the token.
      body: JSON.stringify({ title, category, description }),
    });

    // The server replies with the new ticket, or an error message
    const result = await response.json();

    // response.ok is false for error codes like 400 (missing field)
    // or 401 (not logged in / token expired)
    if (!response.ok) {
      console.error("Ticket submission failed:", result);
      alert(result.message || "Failed to submit ticket.");
      return;
    }

    alert("Ticket submitted successfully.");
    form.reset();
    await loadITRequests();
  } catch (error) {
    console.error("Error submitting ticket:", error);
    alert("An error occurred while submitting the ticket.");
  }
}

// Connect the form to submitTicket so it runs when the form is submitted
document.getElementById("ticket-form").addEventListener("submit", submitTicket);

async function logout() {
  // Clear the session storage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  // Redirect to the login page
  window.location.href = "login.html";
}

loadITRequests();



