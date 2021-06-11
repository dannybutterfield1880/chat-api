const express = require('express')
const app = express()
const port = 3001;
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
  
var cors = require('cors');
const { decodeToken, generateToken, generatePrivateKey } = require('./utils/jwt');
const { createSchema } = require('./utils/mongoose');
const userSchema = require('./schemas/userSchema');
const chatSchema = require('./schemas/chatShema');
const messageSchema = require('./schemas/messageSchema');
const { rawListeners } = require('./schemas/userSchema');
const Pusher = require('pusher');

mongoose.connect('mongodb://localhost:27017');
require('./schemas/chatShema');
require('./schemas/messageSchema');
require('./schemas/userSchema');

const UserModel = mongoose.model('User', userSchema)
const ChatModel = mongoose.model('Chat', chatSchema)
const MessageModel = mongoose.model('Message', messageSchema)

// const PUSHER_API_KEY = '';
// const PUSHER_API_CLUSTER = ''

var pusher = new Pusher({
  appId: "1214286",
  key: "2ff60f46671a2c428060",
  secret: "583bb284e6c5fa096acc",
  cluster: "eu",
});

app.use(cors())
app.use(express.json());

// app.use((req, res) => {
//   run middleware every time api is called good for checking for false or malicious requests
// })

/**
 * Notes: 
 * 
 * get sample token
 * console.log(generateToken({ username: 'dannyb95' }, generatePrivateKey()))
 * result:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRhbm55Yjk1IiwiaWF0IjoxNjIyNTc5MDYxfQ.k1eSBt79G_4d7JHwzAlT_AuXfNJm7lY4Wxzz0XNoMzs
 * { username: 'dannyb95', iat: 1622579061 }
*/
const Auth = async (req, res, next) => {
  let authToken = req.headers.authorization;

  if (!authToken) {
    return res.send('No auth token found')
  }

  authToken = authToken.replace("Bearer ","");

  const decodedToken = decodeToken(authToken);

  if (!decodedToken) {
    throw new Error('token invalid')
  }

  await UserModel.findOne({ username: decodedToken.username }, (err, user) => {
    if (err) {
      console.error(err);
    }

    req.user = user;
  })

  req.user.lastSeen = new Date();
  await req.user.save();

  await next()
}

app.get('/', (req, res) => {
  res.send('chat api see API Documentation')
})

app.post('/login', async (req, res) => {
  const loggedInUser = await UserModel.findOne({
    username: req.body.username
  });

  if (!loggedInUser) {
    res.send('no user found')
  }

  const token = generateToken({...loggedInUser._doc}, generatePrivateKey());

  res.send({
    token
  });
})

/**
 * unfinished implementation
 */
app.post('/register', async (req, res) => {

  const newUser = await UserModel.create(req.body);

  await newUser.save();

  const token = generateToken({...newUser._doc}, generatePrivateKey());
  
  res.send({
    token
  });
})

app.get('/user', Auth, async (req, res) => {
  res.send(req.user);
})

app.post('/users', Auth, async (req, res) => {
  const search = req.body.search;
  const results = await UserModel.find({username: { $regex: '.*' + search + '.*' } }).limit(5);

  const currentContacts = req.user.contacts;

  const filteredResults = results.filter((result) => {
    return !currentContacts.includes(result._id)
  })

  res.send(filteredResults);
})

//get logged in users contacts
app.get('/contacts', Auth, async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  
  let promises = [];

  user.contacts.map((userId) => {
    promises.push(UserModel.findById(userId))
  })

  const results = await Promise.all(promises);

  return res.send(results)
})

/**
 * add a new contact to logged in user
 * 
 * notes: 
 * users will be able to search for a user by their 
 * username and add them to their list of contacts
 * 
 */
app.post('/contacts', Auth, async (req, res) => {
  const userToAdd = await UserModel.findById(req.body.contactToAdd);
  req.user.contacts.push(userToAdd)
  await req.user.save();

  res.send('contact added')
})

app.delete('/contacts/:id', Auth, async (req, res) => {
  const newContacts = [...req.user.contacts].filter((contact) => {
    console.log('contact', contact._id)
    console.log('id', req.params.id)
    return contact._id != req.params.id 
  })
  console.log(newContacts)
  
  req.user.contacts = newContacts;
  await req.user.save()

  res.send('contact removed')
})

app.get('/chats', Auth, async (req, res) => {
  const results = await ChatModel.find({
    users: { $all: [req.user._id] }
  }).populate('users').populate('lastMessage.sender').sort('-updatedAt');

  res.send(results)
})

app.post('/chats', Auth, async (req, res) => {
  //used to create a new chat for logged in user
  const creator = req.user._id;
  const selectedContactIds = req.body.selectedContacts
  const promises = [];

  selectedContactIds.forEach((contactId) => {
    promises.push(UserModel.findById(contactId));
  })

  //load selectedContacts and get object ids
  const selectedContacts = await Promise.all(promises)
  const selectedContactsOIds = selectedContacts.map((contact) => contact._id);

  const newChat = await ChatModel.create({
    users: [creator, ...selectedContactsOIds],
  });

  await newChat.save();
  res.send({ newChatId: newChat._id })
})

app.get('/chats/:id', Auth, async (req, res) => {
  const results = await MessageModel.find({
    chat: req.params.id
  }).populate('sender').populate('chat')

  res.send(results);
})

app.post('/chats/:id', Auth, async (req, res) => {
  const chatId = req.params.id
  const chat = await ChatModel.findById(chatId)
  const newMessage = await MessageModel.create({
    chat: chatId,
    messageBody: req.body.messageBody,
    sender: req.user
  });

  await newMessage.save()
  
  pusher.trigger(`messages-${chatId}`, "new-message", newMessage);

  chat.lastMessage = {
    messageBody: newMessage.messageBody,
    sender: newMessage.sender,
    sent: new Date()
  }

  await chat.save();

  res.send('message sent!')
})

app.patch('/chats/:id', Auth, (req, res) => {
  //could be used to update the last seen time and who the last person to send a message was for notification purposes
  res.send('update chat')
})

app.delete('/chats/:id', Auth, async (req, res) => {
  const chatId = req.params.id;

  await ChatModel.findOneAndRemove(chatId);
  
  const messages = await MessageModel.find({
    chat: chatId
  });

  //loop through messages in chat and delete all
  messages.reduce(async (prevPromise, nextValue) => {

    await MessageModel.findOneAndDelete(nextValue.id);
    
    await prevPromise;

    return nextValue.id;
  }, {})

  /**
   * notes: 
   * unfinished implementation for development
   * will only delete the chat for the logged in user, maybe just hide the chat for the logged in user and unhide if there is new activity i.e anyone else in the chat sends a new message
  */
  res.send('chat and messages deleted')
})

app.post('/user-typing', function(req, res) {
  const username = req.body.username;
  const typing = req.body.typing;
  pusher.trigger(`${req.body.chatId}-typing`, `typing-${typing?'started':'stopped'}`, {username: username});
  res.status(200).send(`${req.body.username} is typing`);
});
 
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })