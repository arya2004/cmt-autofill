// Save settings
document.getElementById("save").addEventListener("click", function () {
    const profileCount = document.getElementById("profileCount").value;
    const profileName = document.getElementById("profileName").value;
  
    chrome.storage.sync.set(
      {
        profileCount: profileCount,
        profileName: profileName
      },
      function () {
        document.getElementById("status").textContent = "Settings saved!";
        setTimeout(() => {
          document.getElementById("status").textContent = "";
        }, 2000);
      }
    );
  });
  
  // Load settings when page opens
  document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.sync.get(["profileCount", "profileName"], function (data) {
      if (data.profileCount) {
        document.getElementById("profileCount").value = data.profileCount;
      }
      if (data.profileName) {
        document.getElementById("profileName").value = data.profileName;
      }
    });
  });
  