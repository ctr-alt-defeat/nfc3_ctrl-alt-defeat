import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static files from the "public" directory
app.use(express.static('public'));

let apiKey = "a278e6e2a2c74017bf41e600428e918d";

app.get('/',async (req,res)=>{
    const news = await axios.get(`https://newsapi.org/v2/everything?q=valorant&apiKey=a278e6e2a2c74017bf41e600428e918d`, {
        params: {
            key: apiKey // Replace 'api_key' with the actual name of the query parameter expected by the API
        }
    });
    let profile = [news.data.articles[1], news.data.articles[2], news.data.articles[3]];
    console.log(profile);
    res.render("newIndex.ejs",{
        personalBests: profile
    })
})

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
