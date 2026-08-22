const readline = require('readline');
const bcrypt = require('bcryptjs');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = '';
    const onData = (char) => {
      char = char.toString('utf8');
      if (char === '\n' || char === '\r' || char === '') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '') {
        process.exit(1);
      } else if (char === '') {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const username = (await ask('Usuario admin [admin]: ')) || 'admin';
  const password = await askHidden('Contraseña: ');
  if (!password || password.length < 8) {
    console.error('\nLa contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }
  const confirm = await askHidden('Confirmar contraseña: ');
  if (password !== confirm) {
    console.error('\nLas contraseñas no coinciden.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 12);
  console.log('\nPega estas líneas en tu .env:\n');
  console.log(`ADMIN_USERNAME=${username}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  process.exit(0);
})();
