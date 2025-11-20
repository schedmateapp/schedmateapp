import { supabase } from "./supabaseClient.js";

// Helpers
function setLoading(btn, loading, textWhenIdle) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : textWhenIdle;
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    setLoading(loginBtn, true, "Log in");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(loginBtn, false, "Log in");

    if (error) {
      errorEl.textContent = error.message || "Unable to log in.";
      errorEl.hidden = false;
      return;
    }

    if (data.session) {
      window.location.href = "dashboard.html";
    }
  });
}

// SIGNUP
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const businessInput = document.getElementById("signupBusiness");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const signupBtn = document.getElementById("signupBtn");
  const errorEl = document.getElementById("signupError");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    setLoading(signupBtn, true, "Create my account");

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const businessName = businessInput.value.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(signupBtn, false, "Create my account");
      errorEl.textContent = error.message || "Unable to create account.";
      errorEl.hidden = false;
      return;
    }

    // Create basic business profile
    const user = data.user;
    if (user) {
      await supabase.from("business_profiles").insert({
        user_id: user.id,
        business_name: businessName,
      });
    }

    setLoading(signupBtn, false, "Create my account");
    window.location.href = "dashboard.html";
  });
}

// FORGOT PASSWORD
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  const emailInput = document.getElementById("resetEmail");
  const resetBtn = document.getElementById("resetBtn");
  const msgEl = document.getElementById("resetMessage");
  const errorEl = document.getElementById("resetError");

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.hidden = true;
    errorEl.hidden = true;
    setLoading(resetBtn, true, "Send reset link");

    const email = emailInput.value.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login.html`,
    });

    setLoading(resetBtn, false, "Send reset link");

    if (error) {
      errorEl.textContent =
        error.message || "We couldn’t send the reset link right now.";
      errorEl.hidden = false;
      return;
    }

    msgEl.textContent = "If that email exists, we’ve sent a reset link.";
    msgEl.hidden = false;
  });
}
