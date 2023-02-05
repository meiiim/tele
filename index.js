const TeleBot = require('telebot');
const { Configuration, OpenAIApi } = require('openai');
const util = require('util');
const os = require('os');
const fs = require('fs')
const moment = require('moment-timezone')
let { performance } = require('perf_hooks');
let { sizeFormatter } = require('human-readable');
let cp = require('child_process');

let exec = util.promisify(cp.exec).bind(cp);

require('./config');

const bot = new TeleBot(global.teleApi);

let configuration = new Configuration({
  apiKey:global.gptApi ,
});
let openai = new OpenAIApi(configuration);

let format = sizeFormatter({
  std: 'JEDEC', // 'SI' (default) | 'IEC' | 'JEDEC'
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

const prefix = '/'

  
	bot.on('text', async (msg) => {

		const text = msg.text;
        let body = text.startsWith(prefix) ? text.toString() : '';
		const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
		const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss');

let newData = {
  date: time,
  name: msg.from.first_name,
  username: msg.from.username,
  id: msg.from.id,
  isBot: msg.from.is_bot,
  text: text
}
    
// membaca file database.json
fs.readFile("./database.json", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  if (data) {
    database = JSON.parse(data);
  } else {
    database = [];
  }
  
  database.push(newData); 

  // menulis data ke file database.json
  fs.writeFile("./database.json", JSON.stringify(database, null, 2), err => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data has been saved to database.json file");
  });
});

        console.log(newData);

		switch(command) {
         
         case 'speedtest': {
     	 	msg.reply.text('Please wait....');
             let exec = util.promisify(cp.exec).bind(cp);
             let o
               try {
              o = await exec('python3 speed.py --share --secure');
             } catch (e) {
            o = e
             } finally {
           let { stdout, stderr } = o
           if (stdout.trim()) msg.reply.text(stdout);
           if (stderr.trim()) msg.reply.text(stderr);
            } 
         }
         break

         case 'start': {
          msg.reply.text(`Selamat datang di bot ChatGPT saya!\n\nKetik pertanyaanmu untuk bertanya.`);
         }
         break

         case 'donasi': case 'donate': {
          txt = `Donasi seikhlasnya agar bot bisa terus aktif

Bank : ${global.donate.bank} (${global.donate.bankName })
Dana : ${global.donate.dana}
SPay : ${global.donate.spay}
Gopay : ${global.donate.gpay}

1 rupiah pun sangat berarti bagi kami
Terimakasih.
`
         bot.sendPhoto(msg.from.id, global.donate.qris, {caption : txt});
         }
         break

         case 'ping': {
		  const used = process.memoryUsage();
		  const cpus = os.cpus().map(cpu => {
		    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
		    return cpu
		  })
		  const cpu = cpus.reduce((last, cpu, _, { length }) => {
		    last.total += cpu.total
		    last.speed += cpu.speed / length
		    last.times.user += cpu.times.user
		    last.times.nice += cpu.times.nice
		    last.times.sys += cpu.times.sys
		    last.times.idle += cpu.times.idle
		    last.times.irq += cpu.times.irq
		    return last
		  }, {
		    speed: 0,
		    total: 0,
		    times: {
		      user: 0,
		      nice: 0,
		      sys: 0,
		      idle: 0,
		      irq: 0
		    }
		  })
		  let old = performance.now();
		  await msg.reply.text('Testing speed...');
		  let neww = performance.now();
		  let speed = neww - old
		  msg.reply.text(`
Merespon dalam ${speed} millidetik

💻 Server Info :

Ram: ${format(os.totalmem() - os.freemem())} / ${format(os.totalmem())}
Terpakai: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB

NodeJS Memory Usage
${'```' + Object.keys(used).map((key, _, arr) => `${key.padEnd(Math.max(...arr.map(v=>v.length)),' ')}: ${format(used[key])}`).join('\n') + '```'}

${cpus[0] ? `Total CPU Usage
${cpus[0].model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times).map(type => `- ${(type).padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}

CPU Core(s) Usage (${cpus.length} Core CPU)
${cpus.map((cpu, i) => `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times).map(type => `- ${(type).padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}`).join('\n\n')}` : ''}
`.trim());
         }
         break

         default : {

		      if (text.startsWith('>')){
		      	if (!msg.from.id == global.ownId) return
                try {
					let evaled = await eval(`(async () => { return ${text.slice(1)} })()`);
					if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
					await msg.reply.text(evaled);
					} catch (err) {
					await msg.reply.text(String(err))
					}
		      } else if (text.startsWith('$')) {
		      	if (!msg.from.id == global.ownId) return
		      	  msg.reply.text('Executing...')
				  let o
				  try {
				    o = await exec(command.trimStart()  + ' ' + text.slice(1).trimEnd())
				  } catch (e) {
				    o = e
				  } finally {
				    let { stdout, stderr } = o
				    if (stdout.trim()) msg.reply.text(stdout)
				    if (stderr.trim()) msg.reply.text(stderr)
					  }
		      } else {
		      	try {
		      	badword = global.badword

		      	let found = false;

                for (let i = 0; i < badword.length; i++) {
				  if (text.includes(badword[i])) {
				    found = true;
				    break;
				  }
				}

			if (found) {
             msg.reply.text("Maaf pertanyaan yang kamu ajukan mengandung kata sensitif yang melanggar standard komonitas kami.");
			} else {
		      if (text.length > 100) return msg.reply.text('Maaf pesan terlalu panjang!');
		      const prompt = `${text}\n`
		      let response = await openai.createCompletion({
		        model: "text-davinci-003",
		        prompt: prompt,
		        temperature: 1,
		        max_tokens: 3000,
		        top_p: 1.0,
		        frequency_penalty: 0.0,
		        presence_penalty: 0.0,
		      });
		      msg.reply.text(response.data.choices[0].text);
		     }
		    } catch {
		      msg.reply.text('Maaf saya tidak mengerti');
		    }
	      }

         }

		}

	});


bot.start();