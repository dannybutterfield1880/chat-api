const jwt = require('jsonwebtoken');

const generatePrivateKey = (length = 12) => makeRandomKey(length);

const generateToken = (object, privateKey) => jwt.sign(object, privateKey);

const decodeToken = (token) => {
    const decodedToken = jwt.decode(token)
    return decodedToken;
}

const makeRandomKey = (length) => {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
   }
   return result.join('');
}

module.exports = {
    generatePrivateKey,
    generateToken,
    decodeToken,
    makeRandomKey
}
