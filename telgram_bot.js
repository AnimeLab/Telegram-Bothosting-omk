const admin = require("firebase-admin");
const TelegramBot = require('node-telegram-bot-api');

const serviceAccount = 'C:/Users/hp/OneDrive - Dynamic techno/Desktop/Moviesbot/moviesdatbase-firebase-adminsdk-aayip-c230ad0f1f.json';
const firebaseConfig = {
  apiKey: "AIzaSyAfIhACRTaa9FGjUj8cCZvCIL2JNHnPwsA",
  authDomain: "moviesdatbase.firebaseapp.com",
  projectId: "moviesdatbase",
  storageBucket: "moviesdatbase.appspot.com",
  messagingSenderId: "585930867329",
  appId: "1:585930867329:web:6f38f7a613c85ca7904380",
  measurementId: "G-VF1GSVJY6Q",
  databaseURL: "https://moviesdatbase-default-rtdb.asia-southeast1.firebasedatabase.app"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL
});

const token = '6897999872:AAEnWFId3GazwKye2D1hwpzVLOGxdKmnV8A';
const bot = new TelegramBot(token, { polling: true });
const conversations = {};

function movieExists(animeName) {
  return admin.database().ref(`/movies/${animeName}`).once('value')
    .then((snapshot) => {
      return snapshot.exists();
    });
}

async function getAllMovies(animeName) {
  const dbPath = `/movies/${animeName}`;
  try {
    const snapshot = await admin.database().ref(dbPath).once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Error retrieving movies:', error);
    return {};
  }
}

function askForAnimeName(chatId) {
  bot.sendMessage(chatId, 'Please enter the name of the anime:');
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.getChatMember('@AnimeLabOfficial', chatId)
    .then((chatMember) => {
      if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
        bot.sendMessage(chatId, 'Hello! I am your Movie Search Bot. What anime are you looking for?');
        conversations[chatId] = { step: 1, data: {} };
        askForAnimeName(chatId);
      } else {
        bot.sendMessage(chatId, 'To use this bot, please join our channel @AnimeLabOfficial.');
      }
    })
    .catch((error) => {
      console.error('Error checking channel membership:', error);
    });
});

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  let userMessage = msg.text;
  const userData = conversations[chatId];

  if (!userData) {
    return;
  }

  userMessage = userMessage.toLowerCase().trim();

  switch (userData.step) {
    case 1:
      userData.data.animeName = userMessage;
      movieExists(userData.data.animeName)
        .then((exists) => {
          if (exists) {
            // Anime found, proceed to fetch and send all movies
            userData.step++;
            getAllMovies(userData.data.animeName)
              .then((movies) => {
                if (movies) {
                  bot.sendMessage(chatId, 'Here are all the movies...');
                  sendAllMovies(chatId, movies);
                } else {
                  bot.sendMessage(chatId, 'No movies found for this anime.');
                }
              })
              .catch((error) => {
                console.error('Error fetching movies:', error);
                bot.sendMessage(chatId, 'An error occurred while fetching movies.');
              });
          } else if (userMessage === 'cancel') {
            bot.sendMessage(chatId, 'You have canceled the operation.');
            delete conversations[chatId];
          } else {
            bot.sendMessage(chatId, 'Anime not found. Please check the name and try again or type "cancel" to exit.');
          }
        })
        .catch((error) => {
          console.error('Error checking if anime exists:', error);
        });
      break;
  }
});

function sendAllMovies(chatId, movies) {
  for (const key in movies) {
    if (movies.hasOwnProperty(key)) {
      const movie = movies[key];
      const video = movie.link;
      const thumbnail = movie.thumbnail;
      const caption = `Link: ${movie.link}`;
      bot.sendPhoto(chatId, thumbnail);
      // Send the video with the thumbnail and link as the caption
      bot.sendVideo(chatId, video);
      
      // Optionally, you can send additional information about the movies if needed
    }
  }
}

// Add more functions as needed for your specific requirements
