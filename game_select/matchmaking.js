import express from 'express';
import axios from 'axios';
import pg from "pg";
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const db = new pg.Client({
    connectionString: "postgresql://varun:Y6QXvENpg93LA2UsS8earw@yeti-molerat-8089.8nk.gcp-asia-southeast1.cockroachlabs.cloud:26257/gamingFinder?sslmode=verify-full"
  })
  db.connect();
  // Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game_selection.html'));
});


app.post('/submit-game-details', async (req,res)=>{
    console.log(req.body);
    // console.log(`Name: ${req.body['ingame-name']}`);
    // console.log(`Hashtag: ${req.body['ingame-hashtag']}`);

    
    // console.log(req.params);
    const name = req.body['ingame-name'];
    const tag = req.body['ingame-hashtag'];
    console.log(name);
    console.log(tag);
    
    const apiKey = "HDEV-fc39bf10-7f07-4781-bde3-40d7f474866a";
    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`, {
            headers: {
                'Authorization': `${apiKey}` // Replace with the correct header key if needed
            }
        });
        //get puuid
        // console.log(response.data.data.puuid);
        const puuid = response.data.data.puuid;//puuid id of user
        const valName = response.data.data.name
        // console.log(response.data);
        
        const accountLevel = response.data.data.account_level;
        const response2 = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr-history/ap/${puuid}`, {
            headers: {
                'Authorization': `${apiKey}` // Replace with the correct header key if needed
            }
        });
        // console.log(response2.data.data[0].currenttierpatched);
        const rank = response2.data.data[0].currenttierpatched;//rank of user

        const response3 = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/stored-matches/ap/${puuid}`, {
            headers: {
                'Authorization': `${apiKey}` // Replace with the correct header key if needed
            }
        });
        // const {kills , deaths, assists} = (response3.data.data[0])
        // const data = response3.data;
        
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        
        response3.data.data.forEach(game => {
            totalKills += game.stats.kills;
            totalDeaths += game.stats.deaths;
            totalAssists += game.stats.assists;
        });
        console.log(totalKills);
        console.log(totalDeaths);
        console.log(totalAssists);
        console.log(accountLevel);
        

       // Check if the record already exists
    const result = await db.query("SELECT * FROM valorant WHERE puuid = $1", [puuid]);

    if (result.rows.length > 0) {
        console.log("Record already exists. Updating existing record...");
        // Update the existing record instead of inserting a new one
        await db.query(
            "UPDATE valorant SET rank=$2, level=$3, kills=$4, deaths=$5, assists=$6 WHERE puuid=$1",
            [puuid, rank, accountLevel, totalKills, totalDeaths, totalAssists]
        );
    } else {
        // Insert the new record if it doesn't exist
        await db.query(
            "INSERT INTO valorant(puuid, rank, level, kills, deaths, assists) VALUES ($1, $2, $3, $4, $5, $6)",
            [puuid, rank, accountLevel, totalKills, totalDeaths, totalAssists]
        );
    }
    res.render("stats.ejs", {
        name: valName,
        rank: rank,
        kills: totalKills,
        deaths: totalDeaths,
        assists: totalAssists
      });
    
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('An error occurred while fetching data');
    }
    
    // const puuid = req.body.data
    // res.send("Received");
})


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

