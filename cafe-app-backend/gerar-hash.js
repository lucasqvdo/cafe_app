const bcrypt = require('bcryptjs');

bcrypt.hash('admin123', 10).then(hash => {
    console.log('Hash para admin123:');
    console.log(hash);
});
