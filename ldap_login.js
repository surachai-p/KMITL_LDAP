const express = require('express');
const bodyParser = require('body-parser');
const LdapAuth = require('./LdapAuth');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// สร้าง instance ของ LdapAuth
// const ldapAuth = new LdapAuth('ldap://10.252.92.100', 389, 'dc=kmitl,dc=ac,dc=th');
const ldapAuth = new LdapAuth('10.252.92.100', 389, 'dc=kmitl,dc=ac,dc=th');

// API endpoint สำหรับการ login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const isAuthenticated = await ldapAuth.authenticate(username, password);
    
    if (isAuthenticated) {
      const userInfo = await ldapAuth.getUserInfo(username);
      res.json({
        success: true,
        message: 'Authentication successful',
        user: userInfo
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LDAP Login</title>
      <style>
        .container {
          max-width: 400px;
          margin: 50px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        #result {
          margin-top: 20px;
          padding: 10px;
          border-radius: 4px;
        }
        .success {
          background-color: #dff0d8;
          border: 1px solid #d6e9c6;
        }
        .error {
          background-color: #f2dede;
          border: 1px solid #ebccd1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>LDAP Login</h2>
        <form id="loginForm">
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <div id="result" style="display: none;"></div>
      </div>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const resultDiv = document.getElementById('result');

          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            resultDiv.style.display = 'block';
            if (data.success) {
              resultDiv.className = 'success';
              resultDiv.textContent = 'Login successful!';
            } else {
              resultDiv.className = 'error';
              resultDiv.textContent = data.message;
            }
          } catch (error) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'error';
            resultDiv.textContent = 'An error occurred during login.';
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Cleanup when server shuts down
process.on('SIGTERM', () => {
  ldapAuth.close();
  process.exit(0);
});