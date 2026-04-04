const state = {
  config: null,
  currentUser: null,
  activeService: null,
  lastPhone: "",
  admin: {
    vendorId: "usr-vendor-silk",
    services: [],
    activeServiceId: "",
    month: "",
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    state.config = await api("/api/config");
    state.currentUser = getStoredUser();
    if (!state.currentUser && state.config.demoCustomerId) {
      const demoUser = await api(`/api/users/${state.config.demoCustomerId}`);
      setStoredUser(demoUser);
      state.currentUser = demoUser;
    }

    const page = document.body.dataset.page;
    if (page === "home") await initHome();
    if (page === "catalog") await initCatalog();
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
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "So'rov bajarilmadi.");
  }
  return data;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("toyimbor-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  state.currentUser = user;
  localStorage.setItem("toyimbor-user", JSON.stringify(user));
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

function getParams() {
  return new URLSearchParams(window.location.search);
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
  }, 3600);
}

function serviceCardTemplate(service, options = {}) {
  const favoriteIds = new Set(state.currentUser?.favoriteServiceIds || []);
  const isFavorite = favoriteIds.has(service._id);
  const compact = options.compact ? " service-card--compact" : "";
  return `
    <article class="service-card${compact}">
      <div class="service-card__media">
        <img src="${service.image}" alt="${service.name}" />
        <span class="badge">${service.badge || "Verified"}</span>
      </div>
      <div class="service-card__body">
        <div class="service-card__title">
          <div>
            <h3>${service.name}</h3>
            <div class="service-card__meta">
              <span>${service.city}, ${service.district || ""}</span>
              <strong>${service.rating || 0}</strong>
            </div>
          </div>
        </div>
        <p class="muted-text">${service.shortDescription || ""}</p>
        <div class="chip-row">
          ${(service.nextOpenDates || [])
            .map((slot) => `<span class="chip">${formatDate(slot.date)} · ${slot.slotsLeft} slot</span>`)
            .join("")}
        </div>
        <div class="service-card__actions">
          <a class="button button--primary" href="/booking?service=${service._id}">Bron qilish</a>
          <button class="button button--ghost favorite-toggle" data-service="${service._id}" type="button">
            ${isFavorite ? "Saralangan" : "Saralash"}
          </button>
        </div>
      </div>
    </article>
  `;
}

async function toggleFavorite(serviceId) {
  const userId = state.currentUser?._id || state.config.demoCustomerId;
  const user = await api(`/api/users/${userId}/favorites`, {
    method: "POST",
    body: JSON.stringify({ serviceId }),
  });
  setStoredUser({
    ...state.currentUser,
    ...user,
  });
  toast("Saralanganlar yangilandi.");
}

function bindFavoriteToggles(root = document) {
  root.querySelectorAll(".favorite-toggle").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await toggleFavorite(button.dataset.service);
        if (document.body.dataset.page === "catalog") {
          await initCatalog(true);
        }
        if (document.body.dataset.page === "profile") {
          await initProfile(true);
        }
        if (document.body.dataset.page === "home") {
          await initHome(true);
        }
      } catch (error) {
        toast(error.message, "error");
      }
    });
  });
}

async function initHome(skipScroll = false) {
  const data = await api("/api/home");
  const featured = document.getElementById("featured-services");
  featured.innerHTML = data.featuredServices.map((service) => serviceCardTemplate(service)).join("");
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
  if (!skipScroll) window.scrollTo({ top: 0, behavior: "instant" });
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
    document.getElementById("catalog-filter-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = new URLSearchParams();
      for (const [key, value] of form.entries()) {
        if (value) next.set(key, value);
      }
      history.replaceState({}, "", `/catalog?${next.toString()}`);
      initCatalog(true);
    });
  }

  bindFavoriteToggles();
}

function setBookingStep(step) {
  document.querySelectorAll(".flow-step").forEach((item) => item.classList.remove("is-active"));
  document.querySelectorAll(".progress-steps__item").forEach((item, index) => {
    item.classList.toggle("is-active", index < step);
  });
  const stepMap = {
    1: "booking-step-1",
    2: "booking-step-2",
    3: "booking-step-3",
    4: "booking-success",
  };
  document.getElementById(stepMap[step]).classList.add("is-active");
}

function bookingPanelTemplate(service) {
  return `
    <div class="booking-service-panel__image">
      <img src="${service.image}" alt="${service.name}" />
    </div>
    <p class="eyebrow">${service.category}</p>
    <h2>${service.name}</h2>
    <p class="muted-text">${service.description || service.shortDescription || ""}</p>
    <div class="chip-row">
      <span class="chip">${service.city}, ${service.district || ""}</span>
      <span class="chip">Reyting ${service.rating || 0}</span>
      <span class="chip">Sig'im ${service.capacity || "-"}</span>
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
          .slice(0, 8)
          .map((day) => `<span class="chip">${day.day}-kun · ${day.slotsLeft} slot</span>`)
          .join("")}
      </div>
    </div>
  `;
}

async function initBooking() {
  const params = getParams();
  const serviceId = params.get("service") || "svc-venue-silk-garden";
  const service = await api(`/api/services/${serviceId}?month=${state.config.defaultMonth}`);
  state.activeService = service;
  document.getElementById("booking-service-panel").innerHTML = bookingPanelTemplate(service);

  const firstOpen = (service.availability?.days || []).find((day) => day.status !== "full");
  document.getElementById("booking-date").value = firstOpen?.date || state.config.today;

  document.getElementById("request-code-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const phone = document.getElementById("booking-phone").value.trim();
      const result = await api("/api/auth/request-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      state.lastPhone = result.phone;
      const hint = document.getElementById("booking-code-hint");
      if (result.demoCode) {
        hint.classList.remove("hidden");
        hint.textContent = `Demo SMS kodi: ${result.demoCode}`;
      }
      setBookingStep(2);
    } catch (error) {
      toast(error.message, "error");
    }
  });

  document.getElementById("verify-code-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const code = document.getElementById("booking-code").value.trim();
      const result = await api("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({
          phone: state.lastPhone,
          code,
        }),
      });
      setStoredUser(result.user);
      setBookingStep(3);
    } catch (error) {
      toast(error.message, "error");
    }
  });

  document.getElementById("booking-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        userId: state.currentUser._id,
        serviceId: service._id,
        eventDate: form.get("booking-date") || document.getElementById("booking-date").value,
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
      ).textContent = `${booking.serviceName} uchun ${formatDate(
        booking.eventDate,
      )} sanasiga so'rov yuborildi. Holat: ${booking.statusLabel}.`;
      setBookingStep(4);
    } catch (error) {
      toast(error.message, "error");
    }
  });
}

function bookingCardTemplate(item) {
  return `
    <article class="booking-list__card">
      <img src="${item.serviceImage}" alt="${item.serviceName}" />
      <div>
        <div class="section__heading">
          <div>
            <h3>${item.serviceName}</h3>
            <p class="muted-text">${formatDate(item.eventDate)} · ${item.slot}</p>
          </div>
          <span class="status-pill status-pill--${item.status}">${item.status}</span>
        </div>
        <p class="booking-list__text">${item.serviceCategory} · ${item.city}</p>
        <p class="booking-list__text">Jami: ${formatMoney(item.total)}</p>
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
          <h3>${pkg.title}</h3>
        </div>
        <strong>${formatMoney(pkg.total)}</strong>
      </div>
      <p class="muted-text">${pkg.mood}</p>
      <div class="package-card__services">
        ${pkg.services
          .map(
            (service) => `
            <div class="package-card__row">
              <span>${service.name} · ${service.category}</span>
              <strong>${formatMoney(service.price)}</strong>
            </div>`,
          )
          .join("")}
      </div>
    </article>
  `;
}

async function initDashboard() {
  const bootstrap = await api(`/api/dashboard/bootstrap?userId=${state.currentUser._id}`);
  const user = bootstrap.user;
  setStoredUser(user);
  document.getElementById("dashboard-title").textContent = `${user.fullName} uchun boshqaruv paneli`;
  document.getElementById("dashboard-bookings").innerHTML =
    bootstrap.bookings.length > 0
      ? bootstrap.bookings.map((item) => bookingCardTemplate(item)).join("")
      : `<div class="notice">Hozircha bronlar yo'q. Katalogdan xizmat tanlab ko'ring.</div>`;

  const recommendationForm = document.getElementById("recommendation-form");
  recommendationForm.elements.namedItem("location").value = user.city || "Toshkent";
  recommendationForm.elements.namedItem("budget").value = user.budget || 90000000;
  recommendationForm.elements.namedItem("guestCount").value = user.guestCount || 220;
  recommendationForm.elements.namedItem("eventDate").value = user.weddingDate || state.config.today;
  recommendationForm.elements.namedItem("style").value = user.style || "zamonaviy";

  recommendationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
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
  });

  recommendationForm.dispatchEvent(new Event("submit"));
}

async function initProfile(refreshOnly = false) {
  const user = await api(`/api/users/${state.currentUser._id}`);
  setStoredUser(user);
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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
        const updated = await api(`/api/users/${state.currentUser._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setStoredUser(updated);
        toast("Profil saqlandi.");
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }

  bindFavoriteToggles();
}

function summaryCardTemplate(label, value, accent = "") {
  return `
    <article class="stat-card">
      <span>${label}</span>
      <strong>${value}</strong>
      ${accent ? `<p class="muted-text">${accent}</p>` : ""}
    </article>
  `;
}

function adminBookingRowTemplate(booking) {
  return `
    <tr>
      <td>
        <strong>${booking.customerName}</strong>
        <div class="muted-text">${booking.phone}</div>
      </td>
      <td>${booking.serviceName}</td>
      <td>${formatDate(booking.eventDate)} · ${booking.slot}</td>
      <td><span class="status-pill status-pill--${booking.status}">${booking.status}</span></td>
      <td>
        <div class="cluster">
          <button class="button button--ghost button--small admin-booking-status" data-id="${booking._id}" data-status="confirmed" type="button">Tasdiqlash</button>
          <button class="button button--ghost button--small admin-booking-status" data-id="${booking._id}" data-status="cancelled" type="button">Bekor qilish</button>
        </div>
      </td>
    </tr>
  `;
}

function calendarCellTemplate(day) {
  return `
    <article class="calendar-day">
      <div>
        <strong>${day.day}</strong>
        <p class="muted-text">${day.bookingCount} ta bron</p>
      </div>
      <div>
        <div class="calendar-day__status calendar-day__status--${day.status}"></div>
        <p class="muted-text">${day.slotsLeft} ta bo'sh slot</p>
      </div>
    </article>
  `;
}

function adminServiceCardTemplate(service, activeServiceId) {
  return `
    <article class="admin-service-item ${service._id === activeServiceId ? "is-active" : ""}" data-id="${service._id}">
      <p class="eyebrow">${service.category}</p>
      <h3>${service.name}</h3>
      <p class="muted-text">${service.city} · ${service.district || "-"}</p>
    </article>
  `;
}

function galleryItemTemplate(item) {
  return `
    <div class="gallery-grid__item">
      <img src="${item.url}" alt="Service gallery" />
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
  const data = await api(
    `/api/admin/bootstrap?vendorId=${state.admin.vendorId}&month=${month}&serviceId=${serviceId || ""}`,
  );
  state.admin.services = data.services;
  state.admin.activeServiceId = data.activeService?._id || data.services[0]?._id || "";
  state.admin.month = data.month;

  document.getElementById("admin-vendor-name").textContent =
    data.vendor?.venueName || data.vendor?.fullName || "Vendor admin";
  document.getElementById("cloudinary-state").textContent = data.cloudinaryEnabled
    ? "Cloudinary upload tayyor"
    : "Cloudinary sozlanmagan: URL yoki demo rasm bilan ishlang";

  document.getElementById("admin-summary").innerHTML = [
    summaryCardTemplate("Bronlar", data.summary.bookingCount, "Faol buyurtmalar soni"),
    summaryCardTemplate("Kutayotganlar", data.summary.pendingCount, "Tezkor ko'rib chiqish"),
    summaryCardTemplate("Tushum", formatMoney(data.summary.revenue), "Tasdiqlangan bronlar bo'yicha"),
    summaryCardTemplate("Bandlik", `${data.summary.occupancyRate}%`, `${data.summary.serviceCount} ta xizmat`),
  ].join("");

  document.getElementById("admin-bookings-body").innerHTML = data.bookings
    .map((booking) => adminBookingRowTemplate(booking))
    .join("");
  document.getElementById("calendar-service").innerHTML = data.services
    .map(
      (service) =>
        `<option value="${service._id}" ${service._id === state.admin.activeServiceId ? "selected" : ""}>${service.name}</option>`,
    )
    .join("");
  document.getElementById("calendar-month").value = state.admin.month;
  document.getElementById("admin-calendar-grid").innerHTML =
    data.activeService?.availability?.days.map((day) => calendarCellTemplate(day)).join("") ||
    `<div class="notice">Kalendar uchun venue topilmadi.</div>`;
  document.getElementById("admin-service-list").innerHTML = data.services
    .map((service) => adminServiceCardTemplate(service, state.admin.activeServiceId))
    .join("");
  if (data.activeService) {
    fillServiceForm(data.activeService);
    document.getElementById("admin-gallery").innerHTML = (data.activeService.gallery || [])
      .map((item) => galleryItemTemplate(item))
      .join("");
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
        refreshAdmin();
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
  state.admin.vendorId = state.config.demoVendorId || "usr-vendor-silk";
  state.admin.month = state.config.defaultMonth;
  await refreshAdmin();

  document.getElementById("calendar-refresh").addEventListener("click", async () => {
    state.admin.activeServiceId = document.getElementById("calendar-service").value;
    state.admin.month = document.getElementById("calendar-month").value || state.config.defaultMonth;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  });

  document.getElementById("calendar-service").addEventListener("change", async (event) => {
    state.admin.activeServiceId = event.target.value;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  });

  document.getElementById("calendar-month").addEventListener("change", async (event) => {
    state.admin.month = event.target.value || state.config.defaultMonth;
    await refreshAdmin(state.admin.activeServiceId, state.admin.month);
  });

  document.getElementById("create-service-button").addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const created = await api("/api/services", {
        method: "POST",
        body: JSON.stringify({
          vendorId: state.admin.vendorId,
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
  });

  document.getElementById("admin-service-form").addEventListener("submit", async (event) => {
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
  });

  document.getElementById("admin-image-upload-form").addEventListener("submit", async (event) => {
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
  });
}
