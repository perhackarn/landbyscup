import { auth, loginWithEmail, signOut, onAuthStateChanged } from './firebase';

// Auth UI
const headerAuth = document.getElementById("header-auth");

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    alert(error.message);
  }
}

function renderHeaderAuth(user) {
  if (user) {
    headerAuth.innerHTML = `
      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
        <span class="text-primary-200 text-xs sm:text-sm truncate">${user.email || user.displayName}</span>
        <button id="headerLogoutBtn" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm transition-colors flex-shrink-0">Logga ut</button>
      </div>
    `;
    const logoutBtn = document.getElementById("headerLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  } else {
    headerAuth.innerHTML = `<span class="text-primary-300 text-sm">Ej inloggad</span>`;
  }
}

onAuthStateChanged(auth, (user) => {
  renderHeaderAuth(user);
  const loginContainer = document.getElementById("login-box");

  if (user) {
    loginContainer.classList.add("hidden");
  } else {
    loginContainer.classList.remove("hidden");
  }
});

const loginEmailBtn = document.getElementById("loginEmail");
if (loginEmailBtn) {
  loginEmailBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    loginWithEmail(email, password);
  });
}
