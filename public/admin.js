
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
      commentElement.textContent =
        typeof comment === "string" ? comment : comment.text;

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
  commentInput.placeholder = "Enter a comment or resolution note";
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

  // Close Ticket button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close Ticket";

  closeButton.addEventListener("click", async () => {
    const comment = commentInput.value.trim();

    if (!comment) {
      alert("Please enter a resolution comment before closing.");
      return;
    }

    if (!confirm("Close this ticket with the comment provided?")) {
      return;
    }

    await updateTicket(
      ticket._id,
      "/resolve",
      { comment },
      token
    );
  });

  ticketItem.append(
    commentInput,
    addCommentButton,
    closeButton
  );
}


async function loadTickets() {
  const ticketList = document.getElementById("ticket-list");
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  // Only staff can view this page
  if (!token || role !== "staff") {
    window.location.href = "login.html";
    return;
  }

  try {
    // Get all tickets from the server
    const response = await fetch("/api/tickets/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tickets");
    }

    const tickets = await response.json();
    ticketList.textContent = "";

    if (tickets.length === 0) {
      ticketList.textContent = "No tickets found.";
      return;
    }

    // Display all tickets
    tickets.forEach((ticket) => {
      const ticketItem = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = ticket.title;

      const category = document.createElement("p");
      category.textContent = `Category: ${ticket.category}`;

      const description = document.createElement("p");
      description.textContent = `Description: ${ticket.description}`;

      const status = document.createElement("p");
      status.textContent = `Status: ${ticket.status}`;

      ticketItem.append(title, category, description, status);
      createTicketControls(ticket, ticketItem, token);
      ticketList.appendChild(ticketItem);
    });
  } catch (error) {
    ticketList.textContent = "Error loading tickets.";
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
    await loadTickets();
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


loadTickets();
