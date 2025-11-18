import { supabase } from "./supabaseClient_v40.js";

// --------- SESSION & NAVIGATION ---------

const viewButtons = document.querySelectorAll(".sidebar-link");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");
const logoutBtn = document.getElementById("logoutBtn");
const userEmailEl = document.getElementById("currentUserEmail");

let currentUser = null;

const viewMap = {
  todayView: {
    title: "Today at a glance",
    subtitle: "Here’s your schedule for today.",
    hash: "today",
  },
  clientsView: {
    title: "Clients",
    subtitle: "All your customers in one place.",
    hash: "clients",
  },
  settingsView: {
    title: "Workspace settings",
    subtitle: "Update your business details so invoices look professional.",
    hash: "settings",
  },
};

const hashToView = {};
Object.entries(viewMap).forEach(([id, cfg]) => {
  hashToView[cfg.hash] = id;
});

function setView(id, { updateHash = true } = {}) {
  views.forEach((v) => v.classList.remove("active"));
  viewButtons.forEach((btn) => btn.classList.remove("active"));

  const view = document.getElementById(id);
  if (view) view.classList.add("active");

  const btn = document.querySelector(`.sidebar-link[data-view="${id}"]`);
  if (btn) btn.classList.add("active");

  const cfg = viewMap[id];
  if (cfg) {
    viewTitle.textContent = cfg.title;
    viewSubtitle.textContent = cfg.subtitle;
    if (updateHash && cfg.hash) {
      const desiredHash = `#${cfg.hash}`;
      if (window.location.hash !== desiredHash) {
        window.location.hash = cfg.hash;
      }
    }
  }
}

viewButtons.forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

function setViewFromHash() {
  const hash = window.location.hash.replace("#", "");
  const viewId = hashToView[hash] || "todayView";
  setView(viewId, { updateHash: false });
}

window.addEventListener("hashchange", setViewFromHash);

// Ensure logged in
async function loadSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = session.user;
  if (userEmailEl) userEmailEl.textContent = currentUser.email;

  await Promise.all([loadClients(), loadSettings(), loadTodayPanels()]);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

setViewFromHash();
loadSession();

// --------- CLIENTS ---------

const clientsTableBody = document.getElementById("clientsTableBody");
const clientsEmpty = document.getElementById("clientsEmpty");
const todayClientsEmpty = document.getElementById("todayClientsEmpty");
const todayClientsList = document.getElementById("todayClientsList");
const newClientBtn = document.getElementById("newClientBtn");
const addClientFromToday = document.getElementById("addClientFromToday");

// Modal elements
const clientModal = document.getElementById("clientModal");
const clientForm = document.getElementById("clientForm");
const clientModalTitle = document.getElementById("clientModalTitle");
const clientIdInput = document.getElementById("clientId");
const clientNameInput = document.getElementById("clientName");
const clientEmailInput = document.getElementById("clientEmail");
const clientPhoneInput = document.getElementById("clientPhone");
const clientNotesInput = document.getElementById("clientNotes");
const clientCancelBtn = document.getElementById("clientCancelBtn");

function openClientModal(mode, client = null) {
  clientModalTitle.textContent = mode === "edit" ? "Edit client" : "New client";
  if (client) {
    clientIdInput.value = client.id;
    clientNameInput.value = client.name || "";
    clientEmailInput.value = client.email || "";
    clientPhoneInput.value = client.phone || "";
    clientNotesInput.value = client.notes || "";
  } else {
    clientIdInput.value = "";
    clientNameInput.value = "";
    clientEmailInput.value = "";
    clientPhoneInput.value = "";
    clientNotesInput.value = "";
  }
  clientModal.showModal();
}

function closeClientModal() {
  clientModal.close();
}

if (newClientBtn) newClientBtn.addEventListener("click", () => openClientModal("create"));
if (addClientFromToday)
  addClientFromToday.addEventListener("click", () => openClientModal("create"));
if (clientCancelBtn) clientCancelBtn.addEventListener("click", closeClientModal);

clientForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const payload = {
    name: clientNameInput.value.trim(),
    email: clientEmailInput.value.trim(),
    phone: clientPhoneInput.value.trim(),
    notes: clientNotesInput.value.trim(),
    user_id: currentUser.id,
  };

  const id = clientIdInput.value;

  if (id) {
    await supabase.from("clients").update(payload).eq("id", id).eq("user_id", currentUser.id);
  } else {
    await supabase.from("clients").insert(payload);
  }

  closeClientModal();
  await loadClients();
  await loadTodayPanels();
});

async function deleteClient(id) {
  if (!confirm("Delete this client?")) return;
  if (!currentUser) return;
  await supabase.from("clients").delete().eq("id", id).eq("user_id", currentUser.id);
  await loadClients();
  await loadTodayPanels();
}

async function loadClients() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load clients error", error);
    return;
  }

  const clients = data || [];

  // Table
  clientsTableBody.innerHTML = "";
  if (clients.length === 0) {
    clientsEmpty.style.display = "block";
  } else {
    clientsEmpty.style.display = "none";
    clients.forEach((client) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${client.name || ""}</td>
        <td>${client.email || ""}</td>
        <td>${client.phone || ""}</td>
        <td>${client.notes || ""}</td>
        <td>
          <button class="ghost-btn small" data-action="edit">Edit</button>
          <button class="ghost-btn small" data-action="delete">Delete</button>
        </td>
      `;
      tr.querySelector('[data-action="edit"]').addEventListener("click", () =>
        openClientModal("edit", client)
      );
      tr.querySelector('[data-action="delete"]').addEventListener("click", () =>
        deleteClient(client.id)
      );
      clientsTableBody.appendChild(tr);
    });
  }

  // Today clients list
  todayClientsList.innerHTML = "";
  if (clients.length === 0) {
    todayClientsEmpty.style.display = "block";
  } else {
    todayClientsEmpty.style.display = "none";
    clients.slice(0, 5).forEach((client) => {
      const li = document.createElement("li");
      li.textContent = `${client.name} — ${client.email || client.phone || ""}`;
      todayClientsList.appendChild(li);
    });
  }
}

// --------- SETTINGS / BUSINESS PROFILE ---------

const settingsForm = document.getElementById("settingsForm");
const settingsBusinessName = document.getElementById("settingsBusinessName");
const settingsContactEmail = document.getElementById("settingsContactEmail");
const settingsStartTime = document.getElementById("settingsStartTime");
const settingsEndTime = document.getElementById("settingsEndTime");
const settingsStatus = document.getElementById("settingsStatus");
const settingsSaveBtn = document.getElementById("settingsSaveBtn");

async function loadSettings() {
  if (!currentUser || !settingsForm) return;
  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Load settings error", error);
    return;
  }

  if (data) {
    settingsBusinessName.value = data.business_name || "";
    settingsContactEmail.value = data.contact_email || currentUser.email || "";
    settingsStartTime.value = data.start_time || "08:00";
    settingsEndTime.value = data.end_time || "18:00";
  } else {
    settingsContactEmail.value = currentUser.email || "";
  }
}

settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  settingsStatus.hidden = true;
  settingsSaveBtn.disabled = true;

  const payload = {
    user_id: currentUser.id,
    business_name: settingsBusinessName.value.trim(),
    contact_email: settingsContactEmail.value.trim(),
    start_time: settingsStartTime.value,
    end_time: settingsEndTime.value,
  };

  const { data, error } = await supabase
    .from("business_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  settingsSaveBtn.disabled = false;

  if (error) {
    console.error("Save settings error", error);
    return;
  }

  settingsStatus.hidden = false;
  setTimeout(() => (settingsStatus.hidden = true), 2000);
});

// --------- TODAY VIEW / BOOKINGS (READ ONLY FOR NOW) ---------

const bookingsList = document.getElementById("bookingsList");
const bookingsEmpty = document.getElementById("bookingsEmpty");

async function loadTodayPanels() {
  // Clients already loaded in loadClients
  // For now bookings are read-only preview from client_bookings
  if (!currentUser || !bookingsList) return;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("client_bookings")
    .select("id, client_name, service, date, time, notes")
    .eq("user_id", currentUser.id)
    .eq("date", today)
    .order("time", { ascending: true });

  if (error) {
    console.error("Load bookings error", error);
    return;
  }

  const bookings = data || [];

  bookingsList.innerHTML = "";
  if (bookings.length === 0) {
    bookingsEmpty.style.display = "block";
  } else {
    bookingsEmpty.style.display = "none";
    bookings.forEach((b) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${b.time || ""}</strong> — ${
        b.client_name || "Client"
      } (${b.service || "Job"})`;
      bookingsList.appendChild(li);
    });
  }
}

// (Add-booking button reserved for v41)
