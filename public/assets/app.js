const state = {
  config: null,
  authUser: null,
  activeService: null,
  admin: {
    month: "",
    activeServiceId: "",
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    state.config = await api("/api/config");
    state.authUser = state.config.authUser || null;
    renderGlobalChrome();

    const page = document.body.dataset.page;
    if (page === "home") await initHome();
    if (page === "catalog") await initCatalog();
    if (page === "auth") await initAuth();
    if (page === "booking") await initBooking();
    if (page === "dashboard") await initDashboard();
    if (page === "profile") await initProfile();
    if (page === "admin") await initAdmin();
  } catch (error) {
    console.error(error);
    toast(error.message || "Sahifani yuklashda xatolik yuz berdi.", "error");
  }
});

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "So'rov bajarilmadi.");
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function getParams() {
  return new URLSearchParams(window.location.search);
}

function buildNextTarget() {
  return `${window.location.pathname}${window.location.search}`;
}

function buildAuthUrl(mode = "customer", next = buildNextTarget()) {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (next) params.set("next", next);
  return `/auth?${params.toString()}`;
}

function redirectToAuth(mode = "customer", next = buildNextTarget()) {
  window.location.href = buildAuthUrl(mode, next);
}

function redirectAfterAuth() {
  const params = getParams();
  const next = params.get("next");
  if (next) {
    window.location.href = next;
    return;
  }
  window.location.href = state.authUser?.role === "vendor" ? "/admin" : "/dashboard";
}

function ensureRole(role) {
  if (!state.authUser) {
    redirectToAuth(role === "vendor" ? "vendor" : "customer");
    return false;
  }
  if (role && state.authUser.role !== role) {
    window.location.href = state.authUser.role === "vendor" ? "/admin" : "/dashboard";
    return false;
  }
  return true;
}

function toast(message, type = "info") {
  let container = document.getElementById("toast");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast";
    container.className = "notice toast";
    document.body.appendChild(container);
  }
  container.textContent = message;
  container.dataset.type = type;
  container.classList.add("is-visible");
  window.clearTimeout(container._timer);
  container._timer = window.setTimeout(() => {
    container.classList.remove("is-visible");
  }, 3400);
}

function formatMoney(value) {
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
}

function formatDate(value) {
  if (!value) return "Sana ko'rsatilmagan";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderGlobalChrome() {
  document.querySelectorAll(".site-header__actions").forEach((container) => {
    if (!state.authUser) {
      container.innerHTML = `
        <a class="button button--ghost button--small" href="${buildAuthUrl("customer")}">Kirish</a>
        <a class="button button--primary button--small" href="${buildAuthUrl("vendor", "/admin")}">Vendor login</a>
      `;
      return;
    }

    if (state.authUser.role === "vendor") {
      container.innerHTML = `
        <a class="button button--ghost button--small" href="/admin">Admin panel</a>
        <button class="button button--primary button--small logout-button" type="button">Chiqish</button>
      `;
      return;
    }

    container.innerHTML = `
      <a class="button button--ghost button--small" href="/dashboard">Kabinet</a>
      <a class="button button--ghost button--small" href="/profile">${escapeHtml(
        state.authUser.fullName || "Profil",
      )}</a>
      <button class="button button--primary button--small logout-button" type="button">Chiqish</button>
    `;
  });

  const sidebarActions = document.getElementById("admin-session-actions");
  if (sidebarActions) {
    if (state.authUser?.role === "vendor") {
      sidebarActions.innerHTML = `
        <div class="notice notice--soft">
          <strong>${escapeHtml(state.authUser.fullName || "Vendor")}</strong>
          <div class="muted-text">${escapeHtml(state.authUser.email || "")}</div>
        </div>
        <button class="button button--ghost button--wide logout-button" type="button">Chiqish</button>
      `;
    } else {
      sidebarActions.innerHTML = `
        <a class="button button--ghost button--wide" href="${buildAuthUrl("vendor", "/admin")}">Vendor login</a>
      `;
    }
  }

  bindLogoutButtons();
}

function bindLogoutButtons() {
  document.querySelectorAll(".logout-button").forEach((button) => {
    button.onclick = async () => {
      try {
        await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
        state.authUser = null;
        renderGlobalChrome();
        window.location.href = "/";
      } catch (error) {
        toast(error.message, "error");
      }
    };
  });
}

function serviceCardTemplate(service, options = {}) {
  const favoriteIds = new Set(state.authUser?.favoriteServiceIds || []);
  const isFavorite = favoriteIds.has(service._id);
  const compact = options.compact ? " service-card--compact" : "";
  const favoriteLabel = !state.authUser ? "Kirish" : isFavorite ? "Saralangan" : "Saralash";
  return `
    <article class="service-card${compact}">
      <div class="service-card__media">
        <img src="${escapeHtml(service.image)}" alt="${escapeHtml(service.name)}" />
        <span class="badge">${escapeHtml(service.badge || "Verified")}</span>
      </div>
      <div class="service-card__body">
        <div class="service-card__title">
          <div>
            <h3>${escapeHtml(service.name)}</h3>
            <div class="service-card__meta">
              <span>${escapeHtml(service.city || "")}${service.district ? `, ${escapeHtml(service.district)}` : ""}</span>
              <strong>${escapeHtml(String(service.rating || 0))}</strong>
            </div>
          </div>
        </div>
        <p class="muted-text">${escapeHtml(service.shortDescription || "")}</p>
        <div class="chip-row">
          ${(service.nextOpenDates || [])
            .map((slot) => `<span class="chip">${escapeHtml(formatDate(slot.date))} - ${slot.slotsLeft} slot</span>`)
            .join("")}
        </div>
        <div class="service-card__actions">
          <a class="button button--primary" href="/booking?service=${encodeURIComponent(service._id)}">Bron qilish</a>
          <button class="button button--ghost favorite-toggle" data-service="${escapeHtml(service._id)}" type="button">
            ${favoriteLabel}
          </button>
        </div>
      </div>
    </article>
  `;
}

async function toggleFavorite(serviceId) {
  if (!state.authUser || state.authUser.role !== "customer") {
    redirectToAuth("customer");
    return;
  }
  const user = await api(`/api/users/${state.authUser._id}/favorites`, {
    method: "POST",
    body: JSON.stringify({ serviceId }),
  });
  state.authUser = user;
  renderGlobalChrome();
  toast("Saralanganlar yangilandi.");
}

function bindFavoriteToggles(root = document) {
  root.querySelectorAll(".favorite-toggle").forEach((button) => {
    button.onclick = async () => {
      try {
        await toggleFavorite(button.dataset.service);
        const page = document.body.dataset.page;
        if (page === "home") await initHome(true);
        if (page === "catalog") await initCatalog(true);
        if (page === "profile") await initProfile(true);
      } catch (error) {
        toast(error.message, "error");
      }
    };
  });
}

async function initHome(skipScroll = false) {
  const data = await api("/api/home");
  document.getElementById("featured-services").innerHTML = data.featuredServices
    .map((service) => serviceCardTemplate(service))
    .join("");
  document.getElementById("stat-services").textContent = data.stats.serviceCount;
  document.getElementById("stat-customers").textContent = data.stats.customerCount;
  document.getElementById("stat-bookings").textContent = data.stats.bookingCount;
  document.getElementById("stat-revenue").textContent = formatMoney(data.stats.revenue);

  document.getElementById("home-search-form").onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (value) params.set(key, value);
    }
    window.location.href = `/catalog?${params.toString()}`;
  };

  bindFavoriteToggles();
  if (!skipScroll) window.scrollTo({ top: 0, behavior: "auto" });
}

async function initCatalog(refreshOnly = false) {
  const params = getParams();
  const qInput = document.getElementById("catalog-q");
  const cityInput = document.getElementById("catalog-city");
  const categoryInput = document.getElementById("catalog-category");

  qInput.value = params.get("q") || "";
  cityInput.value = params.get("city") || "Toshkent";
  categoryInput.value = params.get("category") || "";

  const query = new URLSearchParams({
    q: qInput.value,
    city: cityInput.value,
    category: categoryInput.value,
  });
  const data = await api(`/api/services?${query.toString()}`);
  document.getElementById("catalog-count").textContent = `${data.items.length} ta xizmat`;
  document.getElementById("catalog-grid").innerHTML = data.items
    .map((service) => serviceCardTemplate(service))
    .join("");

  if (!refreshOnly) {
    document.getElementById("catalog-filter-form").onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = new URLSearchParams();
      for (const [key, value] of form.entries()) {
        if (value) next.set(key, value);
      }
      history.replaceState({}, "", `/catalog?${next.toString()}`);
      initCatalog(true);
    };
  }

  bindFavoriteToggles();
}

async function initAuth() {
  if (state.authUser) {
    redirectAfterAuth();
    return;
  }

  const params = getParams();
  const preferredMode = params.get("mode") === "vendor" ? "vendor" : "customer";
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const roleSelect = document.getElementById("register-role");
  const venueField = document.getElementById("register-venue-field");
  const title = document.getElementById("auth-hero-title");
  const subtitle = document.getElementById("auth-hero-subtitle");

  function syncRoleUi() {
    const vendorMode = roleSelect.value === "vendor";
    venueField.classList.toggle("hidden", !vendorMode);
    title.textContent = vendorMode ? "Vendor kirish va ro'yxatdan o'tish" : "Hisobga kirish";
    subtitle.textContent = vendorMode
      ? "Vendor sifatida kirib, xizmatlar, bronlar va galereyani real boshqaring."
      : "Mijoz sifatida kirib, bronlar, profil va tavsiyalarni real ishlating.";
  }

  roleSelect.value = preferredMode;
  syncRoleUi();
  roleSelect.onchange = syncRoleUi;

  loginForm.onsubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.authUser = result.user;
      renderGlobalChrome();
      redirectAfterAuth();
    } catch (error) {
      toast(error.message, "error");
    }
  };

  registerForm.onsubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (payload.role !== "vendor") {
        delete payload.venueName;
      }
      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.authUser = result.user;
      renderGlobalChrome();
      redirectAfterAuth();
    } catch (error) {
      toast(error.message, "error");
    }
  };
}

function setBookingStep(step) {
  document.querySelectorAll(".flow-step").forEach((item) => item.classList.remove("is-active"));
  document.querySelectorAll(".progress-steps__item").forEach((item, index) => {
    item.classList.toggle("is-active", index < step);
  });
  const stepMap = {
    1: "booking-step-1",
    2: "booking-step-2",
    3: "booking-success",
  };
  document.getElementById(stepMap[step]).classList.add("is-active");
}

function bookingPanelTemplate(service) {
  return `
    <div class="booking-service-panel__image">
      <img src="${escapeHtml(service.image)}" alt="${escapeHtml(service.name)}" />
    </div>
    <p class="eyebrow">${escapeHtml(service.category || "")}</p>
    <h2>${escapeHtml(service.name)}</h2>
    <p class="muted-text">${escapeHtml(service.description || service.shortDescription || "")}</p>
    <div class="chip-row">
      <span class="chip">${escapeHtml(service.city || "")}${service.district ? `, ${escapeHtml(service.district)}` : ""}</span>
      <span class="chip">Reyting ${escapeHtml(String(service.rating || 0))}</span>
      <span class="chip">Sig'im ${escapeHtml(String(service.capacity || "-"))}</span>
    </div>
    <div class="section">
      <div class="section__heading">
        <div>
          <p class="eyebrow">Mavjud sanalar</p>
          <h3>Bu oy bandlik</h3>
        </div>
      </div>
      <div class="chip-row">
        ${(service.availability?.days || [])
          .filter((day) => day.status !== "full")
          .slice(0, 10)
          .map((day) => `<span class="chip">${day.day}-kun - ${day.slotsLeft} slot</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function bookingStepOneTemplate() {
  if (!state.authUser) {
    return `
      <p class="eyebrow">Qadam 1 / 3</p>
      <h1>Akkaunt bilan davom eting</h1>
      <p class="muted-text">Bron yuborishdan oldin tizimga kirish yoki ro'yxatdan o'tish kerak.</p>
      <div class="stack-form">
        <a class="button button--primary button--wide" href="${buildAuthUrl("customer", buildNextTarget())}">Kirish yoki ro'yxatdan o'tish</a>
        <a class="button button--ghost button--wide" href="/catalog">Katalogga qaytish</a>
      </div>
    `;
  }

  return `
    <p class="eyebrow">Qadam 1 / 3</p>
    <h1>Akkaunt tasdiqlandi</h1>
    <div class="account-summary">
      <div>
        <span>Ism</span>
        <strong>${escapeHtml(state.authUser.fullName || "")}</strong>
      </div>
      <div>
        <span>Telefon</span>
        <strong>${escapeHtml(state.authUser.phone || "")}</strong>
      </div>
      <div>
        <span>Email</span>
        <strong>${escapeHtml(state.authUser.email || "")}</strong>
      </div>
    </div>
    <button id="booking-account-continue" class="button button--primary button--wide" type="button">Bron tafsilotlariga o'tish</button>
  `;
}

async function initBooking() {
  const serviceId = getParams().get("service");
  if (!serviceId) {
    window.location.href = "/catalog";
    return;
  }

  const service = await api(`/api/services/${encodeURIComponent(serviceId)}?month=${state.config.defaultMonth}`);
  state.activeService = service;
  document.getElementById("booking-service-panel").innerHTML = bookingPanelTemplate(service);
  document.getElementById("booking-step-1-content").innerHTML = bookingStepOneTemplate();

  if (!state.authUser) {
    setBookingStep(1);
    return;
  }
  if (state.authUser.role !== "customer") {
    window.location.href = "/admin";
    return;
  }

  document.getElementById("booking-account-continue").onclick = () => setBookingStep(2);
  const firstOpen = (service.availability?.days || []).find((day) => day.status !== "full");
  document.getElementById("booking-date").value = firstOpen?.date || state.config.today;

  document.getElementById("booking-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        serviceId: service._id,
        eventDate: document.getElementById("booking-date").value,
        slot: document.getElementById("booking-slot").value,
        guestCount: document.getElementById("booking-guests").value,
        note: document.getElementById("booking-note").value,
      };
      const booking = await api("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      document.getElementById(
        "booking-success-text",
      ).textContent = `${booking.serviceName} uchun ${formatDate(booking.eventDate)} sanasiga so'rov yuborildi. Holat: ${booking.statusLabel}.`;
      setBookingStep(3);
    } catch (error) {
      toast(error.message, "error");
    }
  };
}

function bookingCardTemplate(item) {
  return `
    <article class="booking-list__card">
      <img src="${escapeHtml(item.serviceImage)}" alt="${escapeHtml(item.serviceName)}" />
      <div>
        <div class="section__heading">
          <div>
            <h3>${escapeHtml(item.serviceName)}</h3>
            <p class="muted-text">${escapeHtml(formatDate(item.eventDate))} - ${escapeHtml(item.slot)}</p>
          </div>
          <span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <p class="booking-list__text">${escapeHtml(item.serviceCategory)} - ${escapeHtml(item.city || "")}</p>
        <p class="booking-list__text">Jami: ${escapeHtml(formatMoney(item.total))}</p>
      </div>
    </article>
  `;
}

function packageTemplate(pkg) {
  return `
    <article class="package-card">
      <div class="section__heading">
        <div>
          <p class="eyebrow">${pkg.withinBudget ? "Byudjetga mos" : "Byudjetdan yuqori"}</p>
          <h3>${escapeHtml(pkg.title)}</h3>
        </div>
        <strong>${escapeHtml(formatMoney(pkg.total))}</strong>
      </div>
      <p class="muted-text">${escapeHtml(pkg.mood)}</p>
      <div class="package-card__services">
        ${pkg.services
          .map(
            (service) => `
              <div class="package-card__row">
                <span>${escapeHtml(service.name)} - ${escapeHtml(service.category)}</span>
                <strong>${escapeHtml(formatMoney(service.price))}</strong>
              </div>`,
          )
          .join("")}
      </div>
    </article>
  `;
}

async function initDashboard() {
  if (!ensureRole("customer")) return;

  const bootstrap = await api("/api/dashboard/bootstrap");
  state.authUser = bootstrap.user;
  renderGlobalChrome();
  document.getElementById("dashboard-title").textContent = `${bootstrap.user.fullName} uchun boshqaruv paneli`;
  document.getElementById("dashboard-bookings").innerHTML =
    bootstrap.bookings.length > 0
      ? bootstrap.bookings.map((item) => bookingCardTemplate(item)).join("")
      : `<div class="notice">Hozircha bronlar yo'q. Katalogdan xizmat tanlab ko'ring.</div>`;

  const recommendationForm = document.getElementById("recommendation-form");
  recommendationForm.elements.namedItem("location").value = bootstrap.user.city || "Toshkent";
  recommendationForm.elements.namedItem("budget").value = bootstrap.user.budget || 90000000;
  recommendationForm.elements.namedItem("guestCount").value = bootstrap.user.guestCount || 220;
  recommendationForm.elements.namedItem("eventDate").value =
    bootstrap.user.weddingDate || state.config.today;
  recommendationForm.elements.namedItem("style").value = bootstrap.user.style || "zamonaviy";

  recommendationForm.onsubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const result = await api("/api/recommendations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      document.getElementById("recommendation-results").innerHTML = result.packages
        .map((pkg) => packageTemplate(pkg))
        .join("");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  recommendationForm.dispatchEvent(new Event("submit"));
}

async function initProfile(refreshOnly = false) {
  if (!ensureRole("customer")) return;

  const user = await api(`/api/users/${state.authUser._id}`);
  state.authUser = user;
  renderGlobalChrome();
  document.getElementById("profile-hero-name").textContent = user.fullName;

  const form = document.getElementById("profile-form");
  form.elements.namedItem("fullName").value = user.fullName || "";
  form.elements.namedItem("phone").value = user.phone || "";
  form.elements.namedItem("email").value = user.email || "";
  form.elements.namedItem("city").value = user.city || "";
  form.elements.namedItem("weddingDate").value = user.weddingDate || "";
  form.elements.namedItem("budget").value = user.budget || "";
  form.elements.namedItem("guestCount").value = user.guestCount || "";
  form.elements.namedItem("style").value = user.style || "zamonaviy";

  document.getElementById("favorites-grid").innerHTML =
    user.favorites?.length > 0
      ? user.favorites.map((service) => serviceCardTemplate(service, { compact: true })).join("")
      : `<div class="notice">Hozircha saralangan xizmatlar yo'q.</div>`;

  if (!refreshOnly) {
    form.onsubmit = async (event) => {
      event.preventDefault();
      try {
        const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
        const updated = await api(`/api/users/${state.authUser._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        state.authUser = updated;
        renderGlobalChrome();
        toast("Profil saqlandi.");
      } catch (error) {
        toast(error.message, "error");
      }
    };
  }

  bindFavoriteToggles();
}

function summaryCardTemplate(label, value, accent = "") {
  return `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${accent ? `<p class="muted-text">${escapeHtml(accent)}</p>` : ""}
    </article>
  `;
}

function adminBookingRowTemplate(booking) {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(booking.customerName)}</strong>
        <div class="muted-text">${escapeHtml(booking.phone || "")}</div>
      </td>
      <td>${escapeHtml(booking.serviceName)}</td>
      <td>${escapeHtml(formatDate(booking.eventDate))} - ${escapeHtml(booking.slot)}</td>
      <td><span class="status-pill status-pill--${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span></td>
      <td>
        <div class="cluster">
          <button class="button button--ghost button--small admin-booking-status" data-id="${escapeHtml(booking._id)}" data-status="confirmed" type="button">Tasdiqlash</button>
          <button class="button button--ghost button--small admin-booking-status" data-id="${escapeHtml(booking._id)}" data-status="cancelled" type="button">Bekor qilish</button>
        </div>
      </td>
    </tr>
  `;
}

function calendarCellTemplate(day) {
  return `
    <article class="calendar-day">
      <div>
        <strong>${escapeHtml(String(day.day))}</strong>
        <p class="muted-text">${escapeHtml(String(day.bookingCount))} ta bron</p>
      </div>
      <div>
        <div class="calendar-day__status calendar-day__status--${escapeHtml(day.status)}"></div>
        <p class="muted-text">${escapeHtml(String(day.slotsLeft))} ta bo'sh slot</p>
      </div>
    </article>
  `;
}

function adminServiceCardTemplate(service, activeServiceId) {
  return `
    <article class="admin-service-item ${service._id === activeServiceId ? "is-active" : ""}" data-id="${escapeHtml(service._id)}">
      <p class="eyebrow">${escapeHtml(service.category)}</p>
      <h3>${escapeHtml(service.name)}</h3>
      <p class="muted-text">${escapeHtml(service.city || "")} - ${escapeHtml(service.district || "-")}</p>
    </article>
  `;
}

function galleryItemTemplate(item) {
  return `
    <div class="gallery-grid__item">
      <img src="${escapeHtml(item.url)}" alt="Service gallery" />
    </div>
  `;
}

function fillServiceForm(service) {
  const form = document.getElementById("admin-service-form");
  form.elements.namedItem("_id").value = service._id || "";
  form.elements.namedItem("name").value = service.name || "";
  form.elements.namedItem("category").value = service.category || "";
  form.elements.namedItem("type").value = service.type || "";
  form.elements.namedItem("city").value = service.city || "";
  form.elements.namedItem("district").value = service.district || "";
  form.elements.namedItem("address").value = service.address || "";
  form.elements.namedItem("badge").value = service.badge || "";
  form.elements.namedItem("capacity").value = service.capacity || "";
  form.elements.namedItem("pricePerGuest").value = service.pricePerGuest || "";
  form.elements.namedItem("basePrice").value = service.basePrice || "";
  form.elements.namedItem("shortDescription").value = service.shortDescription || "";
  form.elements.namedItem("description").value = service.description || "";
  form.elements.namedItem("amenitiesText").value = (service.amenities || []).join(", ");
  form.elements.namedItem("stylesText").value = (service.styles || []).join(", ");
}

async function refreshAdmin(serviceId = state.admin.activeServiceId, month = state.admin.month) {
  const query = new URLSearchParams();
  query.set("month", month || state.config.defaultMonth);
  if (serviceId) query.set("serviceId", serviceId);
  const data = await api(`/api/admin/bootstrap?${query.toString()}`);

  state.admin.activeServiceId = data.activeService?._id || data.services[0]?._id || "";
  state.admin.month = data.month || state.config.defaultMonth;
  state.authUser = data.vendor || state.authUser;
  renderGlobalChrome();

  document.getElementById("admin-vendor-name").textContent =
    data.vendor?.venueName || data.vendor?.fullName || "Vendor admin";
  document.getElementById("cloudinary-state").textContent = data.cloudinaryEnabled
    ? "Cloudinary upload tayyor"
    : "Cloudinary sozlanmagan. Fayl upload uchun .env ni to'ldiring.";

  document.getElementById("admin-summary").innerHTML = [
    summaryCardTemplate("Bronlar", String(data.summary.bookingCount), "Faol buyurtmalar soni"),
    summaryCardTemplate("Kutayotganlar", String(data.summary.pendingCount), "Tezkor ko'rib chiqish"),
    summaryCardTemplate("Tushum", formatMoney(data.summary.revenue), "Tasdiqlangan bronlar bo'yicha"),
    summaryCardTemplate("Bandlik", `${data.summary.occupancyRate}%`, `${data.summary.serviceCount} ta xizmat`),
  ].join("");

  document.getElementById("admin-bookings-body").innerHTML = data.bookings
    .map((booking) => adminBookingRowTemplate(booking))
    .join("");
  document.getElementById("calendar-service").innerHTML = data.services
    .map(
      (service) =>
        `<option value="${escapeHtml(service._id)}" ${service._id === state.admin.activeServiceId ? "selected" : ""}>${escapeHtml(service.name)}</option>`,
    )
    .join("");
  document.getElementById("calendar-month").value = state.admin.month;
  document.getElementById("admin-calendar-grid").innerHTML =
    data.activeService?.availability?.days.map((day) => calendarCellTemplate(day)).join("") ||
    `<div class="notice">Kalendar uchun to'yxona xizmati topilmadi.</div>`;
  document.getElementById("admin-service-list").innerHTML = data.services
    .map((service) => adminServiceCardTemplate(service, state.admin.activeServiceId))
    .join("");

  if (data.activeService) {
    fillServiceForm(data.activeService);
    document.getElementById("admin-gallery").innerHTML = (data.activeService.gallery || [])
      .map((item) => galleryItemTemplate(item))
      .join("");
  } else {
    document.getElementById("admin-gallery").innerHTML = "";
  }

  bindAdminInteractions();
}

function bindAdminInteractions() {
  document.querySelectorAll(".admin-booking-status").forEach((button) => {
    button.onclick = async () => {
      try {
        await api(`/api/bookings/${button.dataset.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.status }),
        });
        toast("Bron holati yangilandi.");
        await refreshAdmin();
      } catch (error) {
        toast(error.message, "error");
      }
    };
  });

  document.querySelectorAll(".admin-service-item").forEach((item) => {
    item.onclick = async () => {
      state.admin.activeServiceId = item.dataset.id;
      await refreshAdmin(item.dataset.id, state.admin.month);
    };
  });
}

async function initAdmin() {
  if (!ensureRole("vendor")) return;

  state.admin.month = state.config.defaultMonth;
  await refreshAdmin();

  document.getElementById("calendar-refresh").onclick = async () => {
    state.admin.activeServiceId = document.getElementById("calendar-service").value;
    state.admin.month = document.getElementById("calendar-month").value || state.config.defaultMonth;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  };

  document.getElementById("calendar-service").onchange = async (event) => {
    state.admin.activeServiceId = event.target.value;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  };

  document.getElementById("calendar-month").onchange = async (event) => {
    state.admin.month = event.target.value || state.config.defaultMonth;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  };

  document.getElementById("create-service-button").onclick = async (event) => {
    event.preventDefault();
    try {
      const created = await api("/api/services", {
        method: "POST",
        body: JSON.stringify({
          name: "Yangi xizmat",
          type: "venue",
          category: "To'yxona",
        }),
      });
      state.admin.activeServiceId = created._id;
      await refreshAdmin(created._id, state.admin.month);
      toast("Yangi xizmat yaratildi.");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  document.getElementById("admin-service-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const get = (name) => form.elements.namedItem(name);
      const payload = {
        name: get("name").value,
        category: get("category").value,
        type: get("type").value,
        city: get("city").value,
        district: get("district").value,
        address: get("address").value,
        badge: get("badge").value,
        capacity: Number(get("capacity").value || 0),
        pricePerGuest: Number(get("pricePerGuest").value || 0),
        basePrice: Number(get("basePrice").value || 0),
        shortDescription: get("shortDescription").value,
        description: get("description").value,
        amenities: get("amenitiesText").value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        styles: get("stylesText").value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      await api(`/api/services/${get("_id").value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast("Xizmat saqlandi.");
      await refreshAdmin(get("_id").value, state.admin.month);
    } catch (error) {
      toast(error.message, "error");
    }
  };

  document.getElementById("admin-image-upload-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      if (!state.admin.activeServiceId) {
        throw new Error("Avval xizmat tanlang.");
      }
      const formData = new FormData(event.currentTarget);
      const updated = await api(`/api/services/${state.admin.activeServiceId}/images`, {
        method: "POST",
        body: formData,
      });
      document.getElementById("admin-gallery").innerHTML = (updated.gallery || [])
        .map((item) => galleryItemTemplate(item))
        .join("");
      event.currentTarget.reset();
      toast("Galereya yangilandi.");
    } catch (error) {
      toast(error.message, "error");
    }
  };
}
