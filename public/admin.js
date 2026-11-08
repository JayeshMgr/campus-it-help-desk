function createTicketControls(ticket, ticketItem, token) {
  // Display existing comments in their own section of the ticket card
  const commentsSection = document.createElement("div");
  commentsSection.className = "ticket-comments";

  const commentsHeading = document.createElement("h4");
  commentsHeading.textContent = "Comments";
  commentsSection.appendChild(commentsHeading);

  if (ticket.comments && ticket.comments.length > 0) {
    ticket.comments.forEach((comment) => {
      const commentElement = document.createElement("p");
      commentElement.className = "comment";

      // If comments are objects, get their text property.
      // If they are strings, display the string directly.
      if (typeof comment === "string") {
        // Support older comments stored as plain strings.
        commentElement.textContent = comment;
      } else {
        const author = comment.authorRole ? `${comment.authorRole}: ` : "";

        let label = "";

        // The extra class gives each kind of comment its own color
        if (comment.type === "resolution") {
          label = "[Resolution] ";
          commentElement.className = "comment comment-resolution";
        } else if (comment.type === "reopen") {
          label = "[Reopening Explanation] ";
          commentElement.className = "comment comment-reopen";
        } else if (comment.authorRole === "staff") {
          commentElement.className = "comment comment-staff";
        } else {
          commentElement.className = "comment comment-student";
        }

        // Show the label and author in bold, followed by the comment text
        const authorElement = document.createElement("strong");
        authorElement.className = "comment-author";
        authorElement.textContent = `${label}${author}`;

        const textElement = document.createElement("span");
        textElement.textContent = comment.text;

        commentElement.append(authorElement, textElement);
      }

      commentsSection.appendChild(commentElement);
    });
  } else {
    const noComments = document.createElement("p");
    noComments.className = "no-comments";
    noComments.textContent = "No comments yet.";
    commentsSection.appendChild(noComments);
  }

  ticketItem.appendChild(commentsSection);

  // Group the status control, comment box, and buttons together
  const actions = document.createElement("div");
  actions.className = "ticket-actions";

  // Let staff change the ticket status
  const statusRow = document.createElement("div");
  statusRow.className = "status-control";

  const statusLabel = document.createElement("label");
  statusLabel.textContent = "Change status:";
  statusLabel.htmlFor = `status-${ticket._id}`;

  const statusSelect = document.createElement("select");
  statusSelect.id = `status-${ticket._id}`;

  ["Open", "In Progress", "Closed"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    statusSelect.appendChild(option);
  });

  // Show the ticket's current status
  statusSelect.value = ticket.status;

  // Button to save the new status
  const updateStatusButton = document.createElement("button");
  updateStatusButton.className = "update-button";
  updateStatusButton.textContent = "Update Status";

  updateStatusButton.addEventListener("click", async () => {
    await updateTicket(
      ticket._id,
      "/status",
      { status: statusSelect.value },
      token,
    );
  });

  statusRow.append(statusLabel, statusSelect, updateStatusButton);
  actions.appendChild(statusRow);
  ticketItem.appendChild(actions);

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
  addCommentButton.className = "comment-button";
  addCommentButton.textContent = "Add Comment";

  addCommentButton.addEventListener("click", async () => {
    const comment = commentInput.value.trim();

    if (!comment) {
      alert("Please enter a comment.");
      return;
    }

    await updateTicket(ticket._id, "/comments", { comment }, token);
  });

  // Close Ticket button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
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

    await updateTicket(ticket._id, "/resolve", { comment }, token);
  });

  const commentButtons = document.createElement("div");
  commentButtons.className = "comment-buttons";
  commentButtons.append(addCommentButton, closeButton);

  actions.append(commentInput, commentButtons);
}

// Create a "Label: value" line for a ticket, with the label in bold
function createTicketDetail(label, value) {
  const detail = document.createElement("p");
  detail.className = "ticket-detail";

  const labelElement = document.createElement("strong");
  labelElement.textContent = `${label}: `;

  const valueElement = document.createElement("span");
  valueElement.textContent = value;

  detail.append(labelElement, valueElement);
  return detail;
}

// Send a comment or resolution note to the backend
async function updateTicket(ticketId, path, body, token) {
  try {
    const response = await fetch(`/api/tickets/${ticketId}${path}`, {
      method: path === "/resolve" || path === "/status" ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      alert("Failed to update ticket.");
      return;
    }

    // Refresh the tickets after saving
    await loadTickets();
  } catch (error) {
    console.error(error);
    alert("Unable to connect to server.");
  }
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

    // Count all tickets based on their status
    const totalTickets = tickets.length;

    const openTickets = tickets.filter(
      (ticket) => ticket.status === "Open",
    ).length;

    const progressTickets = tickets.filter(
      (ticket) => ticket.status === "In Progress",
    ).length;

    const closedTickets = tickets.filter(
      (ticket) => ticket.status === "Closed",
    ).length;

    // Display the counts on the staff dashboard
    document.getElementById("total-count").textContent = totalTickets;
    document.getElementById("open-count").textContent = openTickets;
    document.getElementById("progress-count").textContent = progressTickets;
    document.getElementById("closed-count").textContent = closedTickets;

    // Show the newest submitted tickets first
    tickets.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Filter tickets by the selected status
    const selectedStatus = document.getElementById("status-filter").value;

    const filteredTickets = tickets.filter((ticket) => {
      return selectedStatus === "All" || ticket.status === selectedStatus;
    });
    // Show a message when no tickets match the selected status
    if (filteredTickets.length === 0) {
      ticketList.textContent = "No tickets found for this status.";
      return;
    }

    // Display all tickets
    filteredTickets.forEach((ticket) => {
      const ticketItem = document.createElement("div");
      ticketItem.className = "ticket-card";

      const title = document.createElement("h3");
      title.className = "ticket-title";
      title.textContent = ticket.title;

      // Colored status badge, e.g. "In Progress" gets the class "status-in-progress"
      const status = document.createElement("p");
      status.className = `status-badge status-${ticket.status.toLowerCase().replace(" ", "-")}`;
      status.textContent = `Status: ${ticket.status}`;

      // Submitted by / submitted on, shown together under the title
      const ticketMeta = document.createElement("div");
      ticketMeta.className = "ticket-meta";

      // Show which student submitted this ticket
      const studentEmail = document.createElement("p");
      studentEmail.textContent = `Submitted by: ${ticket.studentId?.email || "Unknown student"}`;
      // Show when the student submitted the ticket
      const submittedDate = document.createElement("p");

      submittedDate.textContent = `Submitted on: ${new Date(
        ticket.createdAt,
      ).toLocaleDateString()}`;

      ticketMeta.append(studentEmail, submittedDate);

      const category = createTicketDetail("Category", ticket.category);
      const description = createTicketDetail("Description", ticket.description);

      ticketItem.append(title, status, ticketMeta, category, description);
      createTicketControls(ticket, ticketItem, token);
      ticketList.appendChild(ticketItem);
    });
  } catch (error) {
    ticketList.textContent = "Error loading tickets.";
    console.error(error);
  }
}

// Reload tickets when staff selects a different status
document.getElementById("status-filter").addEventListener("change", loadTickets);

async function logout() {
  // Clear the session storage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  // Redirect to the login page
  window.location.href = "login.html";
}

loadTickets();
