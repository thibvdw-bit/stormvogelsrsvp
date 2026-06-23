(function () {
  "use strict";

  const config = window.STORMVOGELS_CONFIG || {};
  const apiUrl = String(config.apiUrl || "").trim();
  const localKey = "stormvogels-rsvp-responses";
  const adminMode = new URLSearchParams(window.location.search).has("admin");

  const rsvpView = document.querySelector("#rsvp-view");
  const successView = document.querySelector("#success-view");
  const adminView = document.querySelector("#admin-view");
  const form = document.querySelector("#rsvp-form");
  const breakfastQuestion = document.querySelector("#breakfast-question");
  const formError = document.querySelector("#form-error");
  const submitButton = document.querySelector("#submit-button");
  const editButton = document.querySelector("#edit-button");

  let responses = [];
  let activeFilter = "all";
  let currentPin = "";

  function showError(element, message) {
    element.textContent = message;
    element.hidden = !message;
  }

  function getLocalResponses() {
    try {
      return JSON.parse(localStorage.getItem(localKey) || "[]");
    } catch {
      return [];
    }
  }

  function saveLocalResponse(response) {
    const items = getLocalResponses();
    const existingIndex = items.findIndex((item) => item.deviceId === response.deviceId);
    if (existingIndex >= 0) items[existingIndex] = response;
    else items.push(response);
    localStorage.setItem(localKey, JSON.stringify(items));
  }

  function getDeviceId() {
    let id = localStorage.getItem("stormvogels-device-id");
    if (!id) {
      id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("stormvogels-device-id", id);
    }
    return id;
  }

  async function submitResponse(payload) {
    if (!apiUrl) {
      saveLocalResponse(payload);
      return { ok: true, demo: true };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Opslaan mislukt");
    return result;
  }

  async function fetchResponses(pin) {
    if (!apiUrl) return getLocalResponses();
    const url = `${apiUrl}?action=list&pin=${encodeURIComponent(pin)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Geen toegang");
    return result.responses || [];
  }

  function setBreakfastVisibility(coming) {
    const isComing = coming === "Ja";
    breakfastQuestion.hidden = !isComing;
    const breakfastInputs = breakfastQuestion.querySelectorAll('input[name="breakfast"]');
    breakfastInputs.forEach((input) => {
      input.required = isComing;
      if (!isComing) input.checked = false;
    });
  }

  document.querySelectorAll('input[name="coming"]').forEach((input) => {
    input.addEventListener("change", () => {
      setBreakfastVisibility(input.value);
      showError(formError, "");
      if (input.value === "Ja") {
        window.setTimeout(() => breakfastQuestion.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
      }
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError(formError, "");

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const coming = String(data.get("coming") || "");
    const breakfast = coming === "Ja" ? String(data.get("breakfast") || "") : "Niet van toepassing";

    if (!name) {
      showError(formError, "Vul eerst je naam in.");
      document.querySelector("#name").focus();
      return;
    }
    if (!coming) {
      showError(formError, "Kies of je erbij bent.");
      return;
    }
    if (coming === "Ja" && !breakfast) {
      showError(formError, "Laat nog even weten of je koffiekoeken wenst.");
      return;
    }

    const payload = {
      name,
      coming,
      breakfast,
      deviceId: getDeviceId(),
      submittedAt: new Date().toISOString(),
    };

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Even noteren…";

    try {
      const result = await submitResponse(payload);
      const successTitle = document.querySelector("#success-title");
      const successMessage = document.querySelector("#success-message");
      if (coming === "Ja") {
        successTitle.textContent = "Tot bij de Stormvogels!";
        successMessage.textContent =
          breakfast === "Ja"
            ? "Top, je bent erbij en we voorzien een koffiekoek voor jou."
            : "Top, je bent erbij. De koffiekoeken laten we voor jou achterwege.";
      } else {
        successTitle.textContent = "Jammer, volgende keer!";
        successMessage.textContent = "Je antwoord is goed ontvangen. We supporteren een beetje harder voor jou.";
      }
      if (result.demo) {
        successMessage.textContent += " De pagina staat momenteel nog in lokale demomodus.";
      }
      rsvpView.hidden = true;
      successView.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showError(formError, "Dat lukte even niet. Controleer je verbinding en probeer opnieuw.");
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Antwoord versturen";
    }
  });

  editButton?.addEventListener("click", () => {
    successView.hidden = true;
    rsvpView.hidden = false;
  });

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderDashboard() {
    const yes = responses.filter((item) => item.coming === "Ja");
    const no = responses.filter((item) => item.coming === "Nee");
    const pastry = yes.filter((item) => item.breakfast === "Ja");

    document.querySelector("#stat-total").textContent = responses.length;
    document.querySelector("#stat-yes").textContent = yes.length;
    document.querySelector("#stat-no").textContent = no.length;
    document.querySelector("#stat-pastry").textContent = pastry.length;

    const filtered = responses.filter((item) => {
      if (activeFilter === "yes") return item.coming === "Ja";
      if (activeFilter === "no") return item.coming === "Nee";
      return true;
    });

    const list = document.querySelector("#response-list");
    const emptyState = document.querySelector("#empty-state");
    list.innerHTML = filtered
      .map((item) => {
        const isComing = item.coming === "Ja";
        const breakfastText = !isComing
          ? "—"
          : item.breakfast === "Ja"
            ? "🥐 Ja"
            : "Geen";
        return `
          <article class="response ${isComing ? "yes" : "no"}">
            <span class="response-status">${isComing ? "✓" : "×"}</span>
            <span>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${isComing ? "Komt kijken" : "Komt niet"} · ${escapeHtml(formatDate(item.submittedAt))}</small>
            </span>
            <span class="response-breakfast">${breakfastText}</span>
          </article>`;
      })
      .join("");
    emptyState.hidden = filtered.length > 0;
  }

  async function loadDashboard(pin) {
    const adminError = document.querySelector("#admin-error");
    showError(adminError, "");
    try {
      responses = await fetchResponses(pin);
      responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      currentPin = pin;
      document.querySelector("#admin-login").hidden = true;
      document.querySelector("#dashboard").hidden = false;
      renderDashboard();
    } catch {
      showError(adminError, "De beheercode klopt niet of de gegevens konden niet geladen worden.");
    }
  }

  document.querySelector("#admin-login-button")?.addEventListener("click", () => {
    const pin = document.querySelector("#admin-pin").value.trim();
    if (!apiUrl || pin) loadDashboard(pin);
    else showError(document.querySelector("#admin-error"), "Vul de beheercode in.");
  });

  document.querySelector("#admin-pin")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") document.querySelector("#admin-login-button").click();
  });

  document.querySelector("#refresh-button")?.addEventListener("click", () => {
    if (currentPin || !apiUrl) loadDashboard(currentPin);
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderDashboard();
    });
  });

  document.querySelector("#csv-button")?.addEventListener("click", () => {
    const rows = [
      ["Naam", "Komt", "Koffiekoeken", "Ingediend op"],
      ...responses.map((item) => [item.name, item.coming, item.breakfast, item.submittedAt]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stormvogels-antwoorden.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  if (adminMode) {
    rsvpView.hidden = true;
    successView.hidden = true;
    adminView.hidden = false;
  }
})();
