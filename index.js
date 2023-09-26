require('dotenv').config(); 

const { Client, GatewayIntentBits } = require('discord.js');
const cities = require("cities-list");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

//LOGIN
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
});

//Read message
client.on("messageCreate", async (message) => {
    if(!message.author.bot && message.content.startsWith('!')){
      //console.log(message);
      const msg = message.content.slice(1).split(" ");
      const location = msg[0].charAt(0).toUpperCase() + msg[0].slice(1);
      const command = msg[1];
      if(cities[location] == 1){
        if(msg.length == 1){
          // Call the main function to initiate the API fetch
          const curr = await currTemp(location);
          message.reply(replyCur(curr));
        }
        else if(msg.length == 2){
          switch(command){
            case 'forcast':
              let cast = await forcast(location);
              message.reply(replyFor(cast));
              break;
            default:
              message.reply('Command not found');  
          }
        }
      }
      else{
        message.reply("Location not found")
      }
    }  
  });

function replyCur(info){
  const response = (
      'Current Temp is ' + Math.round(info[0]).toString() + '°C' + ' and feels like ' + Math.round(info[1]).toString() + '°C' +
      '\nSky is currently ' + cloudCover(info[2]) +
      '\nPercipitaion is ' + info[3].toString() + '%' +
      '\nHumidity is ' + info[4].toString() + '%' +
      '\nWind speed is ' + Math.round(info[5]*3.6).toString() + 'kph'
  );
  return response
}

function replyFor(info){
  const response = [];
  var date = new Date();
  
  for(let i = 0; i<5; i++){
    const dayCount = date.toLocaleString('en-us', {  weekday: 'long' });
    let day = (
      
        '\nOn '+ dayCount.toString() + 
        '\nTemp is ' + Math.round(info[i][0]).toString() + '°C' + 
        '\nSky is currently ' + cloudCover(info[i][1]) +
        '\nPercipitaion is ' + info[i][2].toString() + '%' +
        '\nHumidity is ' + info[i][3].toString() + '%' +
        '\nWind speed is ' + Math.round(info[i][4]*3.6) + 'kph'
    );
    response.push(day);
    date.setDate(date.getDate() + 1);
  }

  return response.join('\n');
}


function cloudCover(percent){
  if(percent < 10)
    return 'Clear'
  else if(percent < 30)
    return 'Mostly Clear'
  else if(percent < 50)
    return 'Partly cloudy'
  else if(percent < 70)
    return 'Mostly cloudy'  
  else
    return 'Overcast'
}

async function currTemp(location) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const url = 'https://api.tomorrow.io/v4/weather/realtime?location='+ location +'&units=metric&apikey=' + process.env.WEATHER_TOKEN;

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const obj = await res.json();
    const condition = [];
    condition.push(obj['data']['values']['temperature']); //current temp
    condition.push(obj['data']['values']['cloudCover']); //cloud cover
    condition.push(obj['data']['values']['precipitationProbability']); //precipitaion
    condition.push(obj['data']['values']['humidity']); //humidity
    condition.push(obj['data']['values']['windSpeed']); //wind
    // Return the temperature data
    return condition;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Re-throw the error to handle it at the caller's level
  }
}

async function forcast(location) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const url = 'https://api.tomorrow.io/v4/weather/forecast?location='+ location +'&units=metric&apikey=' + process.env.WEATHER_TOKEN;

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const obj = await res.json();
    const day = []; 
    for(let i = 0; i<5; i++){
      const condition = [];

      condition.push(obj['timelines']['daily'][i]['values']['temperatureApparentAvg']); //current temp
      condition.push(obj['timelines']['daily'][i]['values']['cloudCoverAvg']); //cloud cover
      condition.push(obj['timelines']['daily'][i]['values']['precipitationProbabilityAvg']); //precipitaion
      condition.push(obj['timelines']['daily'][i]['values']['humidityAvg']); //humidity
      condition.push(obj['timelines']['daily'][i]['values']['windSpeedAvg']); //wind
      //console.log(condition[0].toString());
      day.push(condition);
      
    }
    console.log(day);
    // Return the temperature data
    return day;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Re-throw the error to handle it at the caller's level
  }
}




client.login(process.env.CLIENT_TOKEN);