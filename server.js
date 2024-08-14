const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {  register, login, verifyEmail, forgotPassword, resetPassword  } = require('./controllers/authController'); 

const app = express();
const port = 5000; 


app.use(cors({
  origin: 'http://localhost:3000' 
}));

app.use(bodyParser.json());

app.post('/register', register);
app.post('/login', login);
app.get('/verify-email', verifyEmail);
app.post('/forgot-password', forgotPassword);
app.post('/reset-password', resetPassword);



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
