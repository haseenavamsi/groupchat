const http = require('http');
const fs = require('fs');
const { LocalStorage } = require('node-localstorage');

const localStorage = new LocalStorage('./localstorage');

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  if (url === '/') {
    res.write('<html>');
    res.write('<head><title>Enter Message</title></head>');
    res.write('<body>');
    // Get the stored username from local storage, if any
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      res.write(`<h2>Welcome, ${storedUsername}!</h2>`);
    }
    res.write(
      '<form action="/message" method="POST">' +
      '<input type="text" name="username" placeholder="Username"' +
      (storedUsername ? ` value="${storedUsername}"` : '') +
      '><br>' +
      '<input type="text" name="message" placeholder="Message"><br>' +
      '<button type="submit">Send</button>' +
      '</form>'
    );
    res.write('</body>');
    res.write('</html>');
    return res.end();
  }

  if (url === '/message' && method === 'POST') {
    const body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });
    return req.on('end', () => {
      const parsedBody = Buffer.concat(body).toString();
      const username = parsedBody.split('&')[0].split('=')[1];
      const message = parsedBody.split('&')[1].split('=')[1];
      fs.appendFile('message.txt', `${username}: ${message}\n`, (err) => {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.write('An error occurred while saving the message.');
          return res.end();
        }
        // Store the username in local storage for future use
        localStorage.setItem('username', username);
        res.statusCode = 302;
        res.setHeader('Location', '/');
        return res.end();
      });
    });
  }

  if (url === '/messages' && method === 'GET') {
    fs.readFile('message.txt', (err, data) => {
      if (err) {
        console.log(err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.write('An error occurred while retrieving the messages.');
        return res.end();
      }
      res.setHeader('Content-Type', 'text/html');
      res.write('<html>');
      res.write('<head><title>Messages</title></head>');
      res.write('<body><h1>Messages</h1>');
      res.write('<ul>');
      const messages = data.toString().split('\n');
      messages.forEach((message) => {
        if (message) {
          const [username, msg] = message.split(': ');
          res.write(`<li><strong>${username}:</strong> ${msg}</li>`);
        }
      });
      res.write('</ul></body>');
      res.write('</html>');
      return res.end();
    });
  }

  res.setHeader('Content-Type', 'text/html');
  res.write('<html>');
  res.write('<head><title>My First Page</title></head>');
  res.write('<body><h1>Hello from my Node.js Server!</h1></body>');
  res.write('</html>');
  res.end();
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
