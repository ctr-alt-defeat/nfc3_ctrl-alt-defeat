import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const saltRounds = 10;

const db = new pg.Client({
    connectionString: "postgresql://varun:Y6QXvENpg93LA2UsS8earw@yeti-molerat-8089.8nk.gcp-asia-southeast1.cockroachlabs.cloud:26257/gamingFinder?sslmode=verify-full"
  })
db.connect();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Serve the specific HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Handle POST request
app.post('/signup', async (req, res) => {
    console.log('Request body:', req.body); // Debugging line
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        res.status(400).send('Missing fields');
        return;
    }
    
    // console.log('Name:', name);
    // console.log('Email:', email);
    // console.log('Password:', password);
    await bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        db.query("INSERT INTO users (name,email,password) VALUES ($1,$2,$3)",[name,email,hash]);
    });

    res.send('Sign up data received!');
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    console.log("HI");
    
    console.log(req.body);
    
    if (!email || !password) {
        res.status(400).send('Missing email or password');
        return;
    }

    try {
        // Query the database to get the hashed password
        const result = await db.query('SELECT password FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            // No user found with this email
            res.status(401).send('Invalid email or password');
            return;
        }

        // Compare the provided password with the hashed password in the database
        const hashedPassword = result.rows[0].password;
        const match = await bcrypt.compare(password, hashedPassword);

        if (match) {
            res.redirect(`http://localhost:4000/`);
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).send('Internal server error');
    }
});


const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
