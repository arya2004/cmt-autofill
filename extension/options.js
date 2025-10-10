// DOM references
const profilesContainer = document.getElementById("profilesContainer");
const addProfileBtn = document.getElementById("addProfileBtn");
const saveBtn = document.getElementById("save");
const statusElem = document.getElementById("status");

// Render profiles as editable inputs
function renderProfiles(profiles) {
  profilesContainer.innerHTML = "";
  Object.entries(profiles).forEach(([key, name]) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <input class="profile-input" data-profile-id="${key}" value="${name}" placeholder="Profile name" />
      ${
        Object.keys(profiles).length > 1
          ? `<button type="button" class="delete-btn" data-profile-id="${key}">Delete</button>`
          : ""
      }
    `;
    profilesContainer.appendChild(div);
  });
}

// Save profiles to chrome.storage.sync
function saveProfiles() {
  const newProfiles = {};
  document.querySelectorAll(".profile-input").forEach((input) => {
    const key = input.getAttribute("data-profile-id");
    const val = input.value.trim() || key;
    newProfiles[key] = val;
  });
  chrome.storage.sync.set({ profiles: newProfiles }, () => {
    statusElem.textContent = "Settings saved!";
    setTimeout(() => {
      statusElem.textContent = "";
    }, 2000);
  });
}

// Add new profile input
addProfileBtn.addEventListener("click", () => {
  chrome.storage.sync.get("profiles", (data) => {
    const profiles = data.profiles || {};
    let newIdx = 1;
    while (profiles[`profile${newIdx}`]) newIdx++;
    profiles[`profile${newIdx}`] = `Profile ${newIdx}`;
    renderProfiles(profiles);
  });
});

// Delete profile input (delegated)
profilesContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const key = event.target.getAttribute("data-profile-id");
    chrome.storage.sync.get("profiles", (data) => {
      const profiles = data.profiles || {};
      delete profiles[key];
      // Always keep at least one profile
      if (Object.keys(profiles).length === 0) profiles["profile1"] = "Profile 1";
      renderProfiles(profiles);
    });
  }
});

// Save button click handler
saveBtn.addEventListener("click", saveProfiles);

// On load, render profiles with default if none stored
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get("profiles", (data) => {
    let profiles = data.profiles;
    if (!profiles || Object.keys(profiles).length === 0) {
      profiles = { profile1: "Profile 1" };
    }
    renderProfiles(profiles);
  });
});
