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
      ticketList.appendChild(ticketItem);
    });
  } catch (error) {
    ticketList.textContent = "Error loading tickets.";
    console.error(error);
  }
}

loadTickets();
