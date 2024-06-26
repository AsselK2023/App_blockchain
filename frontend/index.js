const express = require('express');
const crypto = require('crypto');
const solanaWeb3 = require('@solana/web3.js');
const nacl = require('tweetnacl');
const fs = require('fs');
const bs58 = require('bs58');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");

const app = express();
const port = 3001;
const connection = new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl('devnet'),
    'confirmed'
);

app.use(express.static(__dirname));
app.use(express.json());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// GET route to retrieve a nonce value for use in signing
app.get('/api/nonce', (req, res) => {
    // Generate a random 32-byte value to use as the nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    res.json({ nonce });
});

const secretKey = 'mySecretKey';

app.post('/login', (req, res) => {
    const { signedMessage, message, publicKey } = req.body;

    const uint8Array = bs58.decode(publicKey);
    const array = Array.from(uint8Array);
    const decodedPublicKey = Buffer.from(array);

    let signature;
    try {
        signature = Buffer.from(signedMessage, 'base64');
    } catch (error) {
        res.status(400).send('The signed message is not a valid base64 string');
        return;
    }

    const messageBuffer = Buffer.from(message, 'utf8');

    console.log(signedMessage.length);

    const isValid = nacl.sign.detached.verify(
        Uint8Array.from(messageBuffer),
        Uint8Array.from(signature),
        Uint8Array.from(decodedPublicKey)
    );

    console.log("isValid: " + isValid)

    if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature.' });
    }

    const token = jwt.sign({ publicKey }, secretKey, { expiresIn: '1h' });
    console.log(token);

    res.json(token); // Send JWT to the frontend
});


// Endpoint for verifying the JWT token and logging in the user
app.post('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    console.log("authHeader: " + authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const token = authHeader.split(' ')[1];
    console.log(token);

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, secretKey);
        console.log(decoded);
        const currentTime = Math.floor(Date.now() / 1000);
        console.log(currentTime);
        if (decoded.exp < currentTime) {
            res.status(200).json({ message: "tokenExpired" });
        } else {
            res.status(200).json({ message: "ok" });
        }

    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/adduser', async (req, res) => {
    try {
        // Validate request body
        const { programId, newAccountSecretKey, name, profilePhoto, bio } = req.body;
        if (!programId || !newAccountSecretKey || !name || !profilePhoto || !bio) {
            throw new Error('Missing required fields');
        }

        // Ensure valid data format and length
        if (typeof programId !== 'string' || typeof newAccountSecretKey !== 'string' ||
            typeof name !== 'string' || typeof profilePhoto !== 'string' || typeof bio !== 'string') {
            throw new Error('Invalid data format');
        }

        // Your existing logic to add user to Solana blockchain program
        // ...

        // Send response
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding user:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/followUser', async (req, res) => {
    try {
        // Validate request body
        const { programId, followerSecretKey, followedPublicKey } = req.body;
        if (!programId || !followerSecretKey || !followedPublicKey) {
            throw new Error('Missing required fields');
        }

        // Ensure valid data format and length
        if (typeof programId !== 'string' || typeof followerSecretKey !== 'string' || typeof followedPublicKey !== 'string') {
            throw new Error('Invalid data format');
        }

        // Your existing logic to follow user in Solana blockchain program
        // ...

        // Send response
        res.json({ success: true });
    } catch (error) {
        console.error('Error following user:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Serve the success page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname + '/home.html'));
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});