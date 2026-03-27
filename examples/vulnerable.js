// Example file with various issues that Guardrail can detect

// 1. Hardcoded API keys (security/hardcoded-api-key)
const API_KEY = "sk-abc123456789012345678901234567890123456789";
const secret_token = "ghp_1234567890abcdef1234567890abcdef12345678";
const config = {
  api_key: "my-super-secret-key-12345678",
  password: "hardcoded-password-123",
};

// 2. SQL Injection (security/sql-injection)
function getUser(db, userId) {
  return db.query("SELECT * FROM users WHERE id = " + userId);
}

function deleteUser(db, name) {
  return db.execute(`DELETE FROM users WHERE name = '${name}'`);
}

// 3. XSS Vulnerability (security/xss-vulnerability)
function renderComment(comment) {
  document.getElementById("output").innerHTML = comment.body;
  document.write(comment.html);
}

// 4. Path Traversal (security/path-traversal)
function downloadFile(req, res) {
  const file = fs.readFileSync(req.params.filename);
  const joined = path.join("/uploads", req.query.path);
  res.send(file);
}

// 5. JWT Misuse (security/jwt-misuse)
function getUserFromToken(token) {
  return jwt.decode(token); // decode without verify!
}
function signToken(payload) {
  return jwt.sign(payload, "my-hardcoded-secret");
}

// 6. Insecure Randomness (security/insecure-randomness)
const sessionToken = Math.random().toString(36).substring(2);
const verificationCode = Math.random().toString().slice(2, 8);

// 7. Open Redirect (security/open-redirect)
function handleLogin(req, res) {
  res.redirect(req.query.returnUrl);
}

// 8. Insecure Cookie (security/insecure-cookie)
function setSession(res, token) {
  res.cookie("session", token);
  res.cookie("auth", token, { httpOnly: false });
}

// 9. Prototype Pollution (security/prototype-pollution)
function mergeConfig(defaults, userConfig) {
  _.merge(defaults, userConfig);
  Object.assign(defaults, userConfig);
}

// 10. Dead code (quality/dead-code)
function processData(data) {
  if (!data) {
    return null;
    console.log("This will never execute");
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    // Error swallowed silently — bad practice
  }
}

function unusedHelper() {
  return "I am never called";
}

// 11. Duplicate logic (quality/duplicate-logic)
function calculateTaxA(amount) {
  const rate = 0.15;
  const base = amount * rate;
  const surcharge = base > 1000 ? base * 0.05 : 0;
  return base + surcharge;
}

function calculateTaxB(amount) {
  const rate = 0.15;
  const base = amount * rate;
  const surcharge = base > 1000 ? base * 0.05 : 0;
  return base + surcharge;
}

// 12. Inefficient loops (performance/inefficient-loop)
function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    console.log(items[i]);
  }
}

async function fetchAll(urls) {
  for (const url of urls) {
    await fetch(url);
  }
}

// 13. Eval (security/no-eval)
function runUserCode(code) {
  eval(code);
  const fn = new Function("x", code);
}
