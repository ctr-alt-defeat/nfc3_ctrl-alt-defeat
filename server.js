import express from 'express';
import session from 'express-session';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');

const db = new pg.Client({
    connectionString: "postgresql://varun:Y6QXvENpg93LA2UsS8earw@yeti-molerat-8089.8nk.gcp-asia-southeast1.cockroachlabs.cloud:26257/gamingFinder?sslmode=verify-full"
  })
  db.connect();

const apiKey = "2275D916F89C38399BEFF3DD01B0E0C1";
let totalKills
    let totalDeaths
    let minsPlayed
    let totalWins
    let kd;
    let csgoName


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/openid', (req, res) => {
    const loginUrlParams = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': 'http://localhost:3000/auth/process-openid',
        'openid.realm': req.protocol + '://' + req.get('host'),
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    };

    const steamLoginUrl = 'https://steamcommunity.com/openid/login?' + new URLSearchParams(loginUrlParams);
    res.redirect(steamLoginUrl);
});

app.get('/auth/process-openid', async (req, res) => {
    // console.log(req.query);
    const claimedId = req.query['openid.claimed_id'];
    const steamId = claimedId.split('/').pop();

    console.log(`Extracted ID: ${steamId}`);

    const response = await axios.get(`http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&steamid=${steamId}`, {
        params: {
            key: apiKey // Replace 'api_key' with the actual name of the query parameter expected by the API
        }
    });

    const response2 = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamId}`, {
        params: {
            key: apiKey // Replace 'api_key' with the actual name of the query parameter expected by the API
        }
    });
    console.log(response2.data.response.players);
    
    console.log(response2.data.response.players[0].personaname);
    
    
    
    totalKills = response.data.playerstats.stats[0].value;
    totalDeaths = response.data.playerstats.stats[1].value;
    minsPlayed = response.data.playerstats.stats[2].value;
    totalWins = response.data.playerstats.stats[5].value;
    kd = totalKills/totalDeaths;
    kd = kd.toFixed(2);
    console.log(kd);
    
    console.log(totalKills);
   
    const result = await db.query("SELECT * FROM csgo WHERE steamId = $1", [steamId]);
    csgoName = response2.data.response.players[0].personaname;

    if (result.rows.length > 0) {
        console.log("Record already exists. Updating existing record...");
        // Update the existing record instead of inserting a new one
        await db.query(
            "UPDATE csgo SET kills=$2, deaths=$3, minsPlayed=$4, totalWins=$5, kd=$6, name=$7 WHERE steamId=$1",
            [steamId, totalKills, totalDeaths, minsPlayed, totalWins, kd, csgoName]
        );
    } else {
        // Insert the new record if it doesn't exist
        await db.query(
            "INSERT INTO csgo (steamId, kills, deaths, minsPlayed, totalWins, kd, name) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [steamId, totalKills, totalDeaths, minsPlayed, totalWins, kd, csgoName]
        );
    }

    
   
    res.render("stats.ejs", {
        gameType: 'csgo',
        name: csgoName,
        kills: totalKills,
        deaths: totalDeaths,
        minsPlayed: minsPlayed,
        totalWins: totalWins,
        kd: kd
      });
    // const openid_sig = req.query['openid.sig'];
    // const openid_signed = req.query['openid.signed'];
    // const openid_assoc_handle = req.query['openid.assoc_handle']
    // // const { openid_signed, openid_assoc_handle, openid_sig } = req.query;
    // // console.log(req.query['openid.sig']);


    
    // console.log('openid_signed:', openid_signed);
    // console.log('openid_assoc_handle:', openid_assoc_handle);
    // console.log('openid_sig:', openid_sig);

    // // Check if required parameters are present
    // if (!openid_signed || !openid_assoc_handle || !openid_sig) {
    //     return res.status(400).send('error: missing required OpenID parameters');
    // }

    // const params = {
    //     'openid.assoc_handle': openid_assoc_handle,
    //     'openid.signed': openid_signed,
    //     'openid.sig': openid_sig,
    //     'openid.ns': 'http://specs.openid.net/auth/2.0',
    //     'openid.mode': 'check_authentication',
    // };

    // openid_signed.split(',').forEach(item => {
    //     params['openid.' + item] = req.query['openid_' + item.replace('.', '_')];
    // });

    // try {
    //     const response = await axios.post('https://steamcommunity.com/openid/login', new URLSearchParams(params));
    //     console.log(response.data);
        
    //     if (/is_valid\s*:\s*true/i.test(response.data)) {
    //         const steamID64 = req.query.openid_claimed_id.match(/(\d{17,25})/)[0];

    //         const userResponse = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=1EDC0D204A7716E809F0B2DABE207BE7&steamids=${steamID64}`);
    //         const userData = userResponse.data.response.players[0];

    //         req.session.logged_in = true;
    //         req.session.userData = {
    //             steam_id: userData.steamid,
    //             name: userData.personaname,
    //             avatar: userData.avatarmedium,
    //         };

    //         res.redirect('/dashboard');
    //     } else {
    //         res.status(400).send('error: unable to validate your request');
    //     }
    // } catch (error) {
    //     res.status(500).send('error: unable to process your request');
    // }
});

app.get('/display-matchmaking',async(req,res)=>{
    // console.log(rank);
    // const result = rank.split(' ')[0]; // Split the string by space and take the first part
    console.log(kd); // Output: "Gold"
    const response = await db.query('SELECT * FROM csgo');
    const rows = response.rows;

    // Assuming rows is an array of objects with a kd property
function calculateMinDifference(rows) {
    if (rows.length <= 1) return rows;

    // Sort rows by kd value first
    rows.sort((a, b) => a.kd - b.kd);

    // Calculate differences and sort based on these differences
    let sortedRows = [];
    let minDifference = Infinity;
    let bestOrder = [];

    // Try to find the order with the smallest maximum difference
    for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
            const diff = Math.abs(rows[i].kd - rows[j].kd);
            if (diff < minDifference) {
                minDifference = diff;
                bestOrder = rows.slice().sort((a, b) => Math.abs(a.kd - b.kd) - Math.abs(b.kd - a.kd));
            }
        }
    }

    return bestOrder;
}

const sortedRows = calculateMinDifference(rows);
console.log(sortedRows);

    // console.log(response.rows);
    // const profiles = response.rows;
    // console.log(valName);
    
    res.render("matchmaking.ejs",{profiles : sortedRows, 
        gameType: 'csgo',
        name: csgoName,
        kills: totalKills,
        deaths: totalDeaths,
        minsPlayed: minsPlayed,
        totalWins: totalWins,
        kd: kd})
});

app.get('/dashboard', (req, res) => {
    if (!req.session.logged_in) {
        return res.redirect('/error');
    }
    res.render('dashboard', { userData: req.session.userData });
});

app.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
