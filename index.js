const discord = require('discord.js');
const fs = require('fs');
const http = require('http');
const db = require('quick.db');
const qdb = require('quick.db');
const moment = require('moment');
const express = require('express');
const ayarlar = require('./ayarlar.json');
const app = express();
app.get('/', (request, response) => {
	response.sendStatus(200);
});
app.listen(process.env.PORT);

//READY.JS

const Discord = require('discord.js');
const client = new Discord.Client();
client.on('ready', async () => {
	client.appInfo = await client.fetchApplication();
	setInterval(async () => {
		client.appInfo = await client.fetchApplication();
	}, 600);

	client.user.setActivity(``, { type: 'WATCHING' });

	console.log('Bot sunucuya giriş yaptı!!');
});

const log = message => {
	console.log(` ${message}`);
};
require('./util/eventLoader.js')(client);

//READY.JS SON

//KOMUT ALGILAYICI

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
	if (err) console.error(err);
	log(`${files.length} komut yüklenecek.`);
	files.forEach(f => {
		let props = require(`./komutlar/${f}`);
		log(`Yüklenen komut: ${props.help.name}.`);
		client.commands.set(props.help.name, props);
		props.conf.aliases.forEach(alias => {
			client.aliases.set(alias, props.help.name);
		});
	});
});

client.reload = command => {
	return new Promise((resolve, reject) => {
		try {
			delete require.cache[require.resolve(`./komutlar/${command}`)];
			let cmd = require(`./komutlar/${command}`);
			client.commands.delete(command);
			client.aliases.forEach((cmd, alias) => {
				if (cmd === command) client.aliases.delete(alias);
			});
			client.commands.set(command, cmd);
			cmd.conf.aliases.forEach(alias => {
				client.aliases.set(alias, cmd.help.name);
			});
			resolve();
		} catch (e) {
			reject(e);
		}
	});
};

client.load = command => {
	return new Promise((resolve, reject) => {
		try {
			let cmd = require(`./komutlar/${command}`);
			client.commands.set(command, cmd);
			cmd.conf.aliases.forEach(alias => {
				client.aliases.set(alias, cmd.help.name);
			});
			resolve();
		} catch (e) {
			reject(e);
		}
	});
};

client.unload = command => {
	return new Promise((resolve, reject) => {
		try {
			delete require.cache[require.resolve(`./komutlar/${command}`)];
			let cmd = require(`./komutlar/${command}`);
			client.commands.delete(command);
			client.aliases.forEach((cmd, alias) => {
				if (cmd === command) client.aliases.delete(alias);
			});
			resolve();
		} catch (e) {
			reject(e);
		}
	});
};

//KOMUT ALGILAYICI SON

client.elevation = message => {
	if (!message.guild) {
		return;
	}
	let permlvl = 0;
	if (message.member.hasPermission('BAN_MEMBERS')) permlvl = 2;
	if (message.member.hasPermission('ADMINISTRATOR')) permlvl = 3;
	if (message.author.id === ayarlar.sahip) permlvl = 4;
	return permlvl;
};
client.login(process.env.TOKEN);

//-----------------------KOMUTLAR-----------------------\\

//ANTİ RAİD

client.on('guildMemberAdd', async member => {
	let kanal =
		(await db.fetch(`antiraidK_${member.guild.id}`)) == 'anti-raid-aç';
	if (!kanal) return;
	var darknesyt = member.guild.owner;
	if (member.user.bot === true) {
		if (db.fetch(`botizin_${member.guild.id}.${member.id}`) == 'aktif') {
			let darknesguardv2 = new Discord.MessageEmbed()
				.setColor('RANDOM')
				.setThumbnail(member.user.avatarURL())
				.setDescription(
					`**${member.user.tag}** (${
						member.id
					}) adlı bota bir yetkili izin verdi eğer kaldırmak istiyorsanız **!bot-izni kaldır <botid>**.`
				);
			darknesyt.send(darknesguardv2);
		} else {
			let izinverilmemişbot = new Discord.MessageEmbed()
				.setColor('RANDOM')
				.setThumbnail(member.user.avatarURL())
				.setDescription(
					'**' +
						member.user.tag +
						'**' +
						' (' +
						member.id +
						') ' +
						'adlı bot sunucuya eklendi ve banladım eğer izin vermek istiyorsanız **' +
						'!bot-izni ver <botid>**'
				);
			member.ban(); // Eğer sunucudan atmak istiyorsanız ban kısmını kick yapın
			darknesyt.send(izinverilmemişbot);
		}
	}
});

//ANTİ RAİD SON

//CAPS ENGEL

client.on('message', async msg => {
	if (msg.channel.type === 'dm') return;
	if (msg.author.bot) return;
	if (msg.content.length > 1) {
		if (db.fetch(`capslock_${msg.guild.id}`)) {
			let caps = msg.content.toUpperCase();
			if (msg.content == caps) {
				if (!msg.member.permissions.has('ADMINISTRATOR')) {
					if (!msg.mentions.users.first()) {
						msg.delete();
						return msg.channel
							.send(`${msg.member}, Capslock Kapat Lütfen!`)
							.then(nordx => nordx.delete({ timeout: 5000 }));
					}
				}
			}
		}
	}
});

//CAPS ENGEL SON

//KANAL & ROL KORUMA

client.on('roleDelete', async role => {
	let rolko = await db.fetch(`rolk_${role.guild.id}`);
	if (rolko) {
		const entry = await role.guild
			.fetchAuditLogs({ type: 'ROLE_DELETE' })
			.then(audit => audit.entries.first());
		if (entry.executor.id == client.user.id) return;
		role.guild.roles.create({
			data: {
				name: role.name,
				color: role.color,
				hoist: role.hoist,
				permissions: role.permissions,
				mentionable: role.mentionable,
				position: role.position
			},
			reason: 'Silinen Roller Tekrar Açıldı.'
		});
	}
});

//

client.on('roleCreate', async role => {
	let rolk = await db.fetch(`rolk_${role.guild.id}`);
	if (rolk) {
		const entry = await role.guild
			.fetchAuditLogs({ type: 'ROLE_CREATE' })
			.then(audit => audit.entries.first());
		if (entry.executor.id == client.user.id) return;
		role.delete();
	}
});

//

client.on('channelDelete', async function(channel) {
	let rol = await db.fetch(`kanalk_${channel.guild.id}`);

	if (rol) {
		const guild = channel.guild.cache;
		let channelp = channel.parentID;

		channel.clone().then(z => {
			let kanal = z.guild.channels.find(c => c.name === z.name);
			kanal.setParent(
				kanal.guild.channels.find(channel => channel.id === channelp)
			);
		});
	}
});

//

client.on('emojiDelete', async (emoji, message, channels) => {
	let emojik = await db.fetch(`emojik_${emoji.guild.id}`);
	if (emojik) {
		const entry = await emoji.guild
			.fetchAuditLogs({ type: 'EMOJI_DELETE' })
			.then(audit => audit.entries.first());
		if (entry.executor.id == client.user.id) return;
		if (entry.executor.id == emoji.guild.owner.id) return;
		if (
			!emoji.guild.members.cache
				.get(entry.executor.id)
				.hasPermission('ADMINISTRATOR')
		) {
			emoji.guild.emojis
				.create(`${emoji.url}`, `${emoji.name}`)
				.catch(console.error);
		}
	}
});

//KANAL & ROL & EMOJİ KORUMA SON

//REKLAM ENGEL

client.on('message', msg => {
	const veri = db.fetch(`${msg.guild.id}.reklam`);
	if (veri) {
		const reklam = [
			'.com',
			'.net',
			'.xyz',
			'.tk',
			'.pw',
			'.io',
			'.me',
			'.gg',
			'www.',
			'https',
			'http',
			'.gl',
			'.org',
			'.com.tr',
			'.biz',
			'net',
			'.rf.gd',
			'.az',
			'.party',
			'discord.gg',
			'youtube.com'
		];
		if (reklam.some(word => msg.content.includes(word))) {
			try {
				if (!msg.member.permissions.has('BAN_MEMBERS')) {
					msg.delete();
					return msg
						.reply('Yakaladım Seni! Reklam Yasak.')
						.then(nordx => nordx.delete({ timeout: 5000 }));
				}
			} catch (err) {
				console.log(err);
			}
		}
	}
	if (!veri) return;
});

//REKLAM ENGEL SON

//EVERYONE-HERE ENGEL

client.on('message', async msg => {
	let hereengelle = await db.fetch(`hereengel_${msg.guild.id}`);
	if (hereengelle == 'acik') {
		const here = ['@here', '@everyone'];
		if (here.some(word => msg.content.toLowerCase().includes(word))) {
			if (!msg.member.permissions.has('ADMINISTRATOR')) {
				msg.delete();
				return msg
					.reply('Yakaladım Seni! Everyone ve Here Etiketlemek Yasak.')
					.then(nordx => nordx.delete({ timeout: 5000 }));
			}
		}
	} else if (hereengelle == 'kapali') {
	}
});

//EVERYONE-HERE ENGEL SON

//FAKE HESAP CEZA

client.on('guildMemberAdd', member => {
	var moment = require('moment');
	require('moment-duration-format');
	moment.locale('tr');
	var { Permissions } = require('discord.js');
	var x = moment(member.user.createdAt)
		.add(3, 'days')
		.fromNow();
	var user = member.user;
	x = x.replace('birkaç saniye önce', ' ');
	if (!x.includes('önce') || x.includes('sonra') || x == ' ') {
		var rol = member.guild.roles.cache.get('785565778140332033'); //Cezalı Rol İD
		var kayıtsız = member.guild.roles.cache.get('757559050232660019'); //Alınacak Rol İD
		member.roles.add(rol);
		member.user.send(
			'Hesabın 3 günden önce açıldığı için cezalıya atıldın! Açtırmak İçin Yetkililere Bildir.'
		);
		setTimeout(() => {
			member.roles.remove(kayıtsız.id);
		}, 1000);
	} else {
	}
});

//FAKE HESAP CEZA SON

//Modlog

client.on('channelCreate', async channel => {
	const c = channel.guild.channels.cache.get(
		db.fetch(`nordxmodlog${channel.guild.id}`)
	);
	if (!c) return;
	var embed = new Discord.MessageEmbed()
		.addField(
			`Kanal oluşturuldu`,
			`Kanal İsmi: \`${channel.name}\`\n Kanal Türü: **${
				channel.type
			}**\nKanal ID: ${channel.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${channel.client.user.username}#${channel.client.user.discriminator}`,
			channel.client.user.avatarURL
		);
	c.send(embed);
});

client.on('channelDelete', async channel => {
	const c = channel.guild.channels.cache.get(
		db.fetch(`nordxmodlog${channel.guild.id}`)
	);
	if (!c) return;
	let embed = new Discord.MessageEmbed()
		.addField(
			`Kanal silindi`,
			`Silinen Kanal İsmi: \`${channel.name}\`\nSilinen Kanal Türü: **${
				channel.type
			}**\nSilinen Kanal ID: ${channel.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${channel.client.user.username}#${channel.client.user.discriminator}`,
			channel.client.user.avatarURL
		);

	c.send(embed);
});

client.on('channelNameUpdate', async channel => {
	const c = channel.guild.channels.cache.get(
		db.fetch(`nordxmodlog${channel.guild.id}`)
	);
	if (!c) return;
	var embed = new Discord.MessageEmbed()
		.addField(
			`Kanal İsmi değiştirildi`,
			` Yeni İsmi: \`${channel.name}\`\nKanal ID: ${channel.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${channel.client.user.username}#${channel.client.user.discriminator}`,
			channel.client.user.avatarURL
		);
	c.send(embed);
});

client.on('emojiCreate', emoji => {
	const c = emoji.guild.channels.cache.get(
		db.fetch(`nordxmodlog${emoji.guild.id}`)
	);
	if (!c) return;

	let embed = new Discord.MessageEmbed()
		.addField(
			`Emoji oluşturuldu`,
			` İsmi: \`${emoji.name}\`\n Gif?: **${emoji.animated}**\nEmoji ID: ${
				emoji.id
			}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${emoji.client.user.username}#${emoji.client.user.discriminator}`,
			emoji.client.user.avatarURL
		);

	c.send(embed);
});
client.on('emojiDelete', emoji => {
	const c = emoji.guild.channels.cache.get(
		db.fetch(`nordxmodlog${emoji.guild.id}`)
	);
	if (!c) return;

	let embed = new Discord.MessageEmbed()
		.addField(
			`Emoji silindi`,
			` İsmi: \`${emoji.name}\`\n Gif? : **${
				emoji.animated
			}**\nSilinen Emoji ID: ${emoji.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${emoji.client.user.username}#${emoji.client.user.discriminator}`,
			emoji.client.user.avatarURL
		);

	c.send(embed);
});
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	const c = newEmoji.guild.channels.cache.get(
		db.fetch(`nordxmodlog${newEmoji.guild.id}`)
	);
	if (!c) return;

	let embed = new Discord.MessageEmbed()
		.addField(
			`Emoji güncellendi`,
			` Eski ismi: \`${oldEmoji.name}\`\n Yeni ismi: \`${
				newEmoji.name
			}\`\nEmoji ID: ${oldEmoji.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${newEmoji.client.user.username}#${newEmoji.client.user.discriminator}`,
			newEmoji.client.user.avatarURL
		);

	c.send(embed);
});

client.on('messageDelete', async message => {
	if (message.author.bot) return;

	const channel = message.guild.channels.cache.get(
		db.fetch(`nordxmodlog${message.guild.id}`)
	);
	if (!channel) return;

	let embed = new Discord.MessageEmbed()
		.setAuthor(
			`Silen Kişi: ${message.author.username}#${message.author.discriminator}`,
			message.author.avatarURL()
		)
		.setTitle('Mesaj silindi')
		.addField(
			`Silinen mesaj : ${message.content}`,
			`Silindiği Kanal: ${message.channel.name}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${message.client.user.username}#${message.client.user.discriminator}`,
			message.client.user.avatarURL
		);

	channel.send(embed);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
	if (oldMessage.author.bot) return;
	if (oldMessage.content == newMessage.content) return;

	const channel = oldMessage.guild.channels.cache.get(
		db.fetch(`nordxmodlog${oldMessage.guild.id}`)
	);
	if (!channel) return;

	let embed = new Discord.MessageEmbed()
		.setTitle('Mesaj güncellendi!')
		.addField('Eski mesaj : ', `${oldMessage.content}`)
		.addField('Yeni mesaj : ', `${newMessage.content}`)
		.addField('Kanal : ', `${oldMessage.channel.name}`)
		.setTimestamp()
		.setColor('RANDOM')
		.setFooter(
			`${oldMessage.client.user.username}#${
				oldMessage.client.user.discriminator
			}`,
			`${oldMessage.client.user.avatarURL}`
		);

	channel.send(embed);
});

client.on('roleCreate', async role => {
	const channel = role.guild.channels.cache.get(
		db.fetch(`nordxmodlog${role.guild.id}`)
	);
	if (!channel) return;

	let embed = new Discord.MessageEmbed()
		.addField(
			`Rol oluşturuldu`,
			`Rol ismi: \`${role.name}\`\nRol ID: ${role.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.addField('Rol renk kodu : ', `${role.hexColor}`)
		.setFooter(
			`${role.client.user.username}#${role.client.user.discriminator}`,
			role.client.user.avatarURL
		);

	channel.send(embed);
});

client.on('roleDelete', async role => {
	const channel = role.guild.channels.cache.get(
		db.fetch(`nordxmodlog${role.guild.id}`)
	);
	if (!channel) return;

	let embed = new Discord.MessageEmbed()
		.addField(
			`Rol silindi`,
			`Silinen Rol ismi: \`${role.name}\`\nSilinen Rol ID: ${role.id}`
		)
		.setTimestamp()
		.setColor('RANDOM')
		.addField('Rol renk kodu : ', `${role.hexColor}`)
		.setFooter(
			`${role.client.user.username}#${role.client.user.discriminator}`,
			role.client.user.avatarURL
		);

	channel.send(embed);
});
client.on('voiceStateUpdate', (oldMember, newMember) => {
	// if (!logA[oldMember.guild.id]) return;

	if (db.has(`nordxmodlog${oldMember.guild.id}`) === false) return;

	var kanal = oldMember.guild.channels.cache.get(
		db
			.fetch(`nordxmodlog${oldMember.guild.id}`)
			.replace('<#', '')
			.replace('>', '')
	);
	if (!kanal) return;

	let newUserChannel = newMember.voiceChannel;
	let oldUserChannel = oldMember.voiceChannel;
});
client.on('ready', () => {
	client.channels.cache.get('818893951103664178').join();
});

//-------------------- Afk Sistemi --------------------//
//-------------------- Afk Sistemi --------------------//
//-------------------- Afk Sistemi --------------------//

const ms = require('parse-ms');
const { DiscordAPIError } = require('discord.js');

client.on('message', async message => {
	if (message.author.bot) return;
	if (!message.guild) return;
	if (message.content.includes(`afk`)) return;

	if (await db.fetch(`afk_${message.author.id}`)) {
		db.delete(`afk_${message.author.id}`);
		db.delete(`afk_süre_${message.author.id}`);

		const embed = new Discord.MessageEmbed()

			.setColor('GREEN')
			.setAuthor(message.author.username, message.author.avatarURL)
			.setDescription(`Afk Modundan Başarıyla Çıkıldı.`);

		message.channel.send(embed);
	}

	var USER = message.mentions.users.first();
	if (!USER) return;
	var REASON = await db.fetch(`afk_${USER.id}`);

	if (REASON) {
		let süre = await db.fetch(`afk_süre_${USER.id}`);
		let timeObj = ms(Date.now() - süre);

		const afk = new Discord.MessageEmbed()

			.setColor('RED')
			.setDescription(
				`**BU KULLANICI AFK**\n\n**Afk Olan Kullanıcı :** \`${
					USER.tag
				}\`\n**Afk Süresi :** \`${timeObj.hours}saat\` \`${
					timeObj.minutes
				}dakika\` \`${timeObj.seconds}saniye\`\n**Sebep :** \`${REASON}\``
			);

		message.channel.send(afk);
	}
});

//-------------------- Afk Sistemi --------------------//
//-------------------- Afk Sistemi --------------------//
//-------------------- Afk Sistemi --------------------//

//-------------------- Otorol Sistemi --------------------//
//-------------------- Otorol Sistemi --------------------//
//-------------------- Otorol Sistemi --------------------//

client.on('guildMemberAdd', async member => {
	let kanal1 = await db.fetch(`otorolkanal_${member.guild.id}`);
	let rol1 = await db.fetch(`otorolrol_${member.guild.id}`);

	let kanal = member.guild.channels.cache.get(kanal1);
	let rol = member.guild.roles.cache.get(rol1);

	if (!kanal) return;
	if (!rol) return;

	const embed = new Discord.MessageEmbed()

		.setColor('BLACK')
		.setDescription(
			`Sunucuya Katılan **${member}** Adlı Kullanıcıya Başarıyla \`${
				rol.name
			}\` Rolü Verildi.`
		);

	kanal.send(embed);
	member.roles.add(rol);
});
client.on('message', async msg => {
	const i = await db.fetch(`ssaass_${msg.guild.id}`);
	if (i == 'acik') {
		if (
			msg.content.toLowerCase() == 'sa' ||
			msg.content.toLowerCase() == 's.a' ||
			msg.content.toLowerCase() == 'selamun aleyküm'
		) {
			try {
				return msg.reply('Aleyküm Selam, Hoşgeldin :wave: ');
			} catch (err) {
				console.log(err);
			}
		}
	} else if (i == 'kapali') {
	}
	if (!i) return;
});

//Modlog Son
client.on("guildMemberRemove", async member => {
  //let resimkanal = JSON.parse(fs.readFileSync("./ayarlar/gç.json", "utf8"));
  //const canvaskanal = member.guild.channels.cache.get(resimkanal[member.guild.id].resim);
  
  if (db.has(`gçkanal_${member.guild.id}`) === false) return;
  var canvaskanal = member.guild.channels.cache.get(db.fetch(`gçkanal_${member.guild.id}`));
  if (!canvaskanal) return;

  const request = require("node-superfetch");
  const Canvas = require("canvas"),
    Image = Canvas.Image,
    Font = Canvas.Font,
    path = require("path");

  var randomMsg = ["Sunucudan Ayrıldı."];
  var randomMsg_integer =
    randomMsg[Math.floor(Math.random() * randomMsg.length)];

  let msj = await db.fetch(`cikisM_${member.guild.id}`);
  if (!msj) msj = `{uye}, ${randomMsg_integer}`;

  const canvas = Canvas.createCanvas(640, 360);
  const ctx = canvas.getContext("2d");

  const background = await Canvas.loadImage(
    "https://i.hizliresim.com/Wrn1XW.jpg"
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#74037b";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = `#D3D3D3`;
  ctx.font = `37px "Warsaw"`;
  ctx.textAlign = "center";
  ctx.fillText(`${member.user.username}`, 300, 342);

  let avatarURL = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
  const { body } = await request.get(avatarURL);
  const avatar = await Canvas.loadImage(body);

  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.arc(250 + 55, 55 + 55, 55, 0, 2 * Math.PI, false);
  ctx.clip();
  ctx.drawImage(avatar, 250, 55, 110, 110);

  const attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "ro-BOT-güle-güle.png"
  );

    canvaskanal.send(attachment);
    canvaskanal.send(
      msj.replace("{uye}", member).replace("{sunucu}", member.guild.name)
    );
    if (member.user.bot)
      return canvaskanal.send(`🤖 Bu bir bot, ${member.user.tag}`);
  
});

client.on("guildMemberAdd", async member => {
  if (db.has(`gçkanal_${member.guild.id}`) === false) return;
  var canvaskanal = member.guild.channels.cache.get(db.fetch(`gçkanal_${member.guild.id}`));

  if (!canvaskanal || canvaskanal ===  undefined) return;
  const request = require("node-superfetch");
  const Canvas = require("canvas"),
    Image = Canvas.Image,
    Font = Canvas.Font,
    path = require("path");

  var randomMsg = ["Sunucuya Katıldı."];
  var randomMsg_integer =
    randomMsg[Math.floor(Math.random() * randomMsg.length)];

  let paket = await db.fetch(`pakets_${member.id}`);
  let msj = await db.fetch(`cikisM_${member.guild.id}`);
  if (!msj) msj = `{uye}, ${randomMsg_integer}`;

  const canvas = Canvas.createCanvas(640, 360);
  const ctx = canvas.getContext("2d");

  const background = await Canvas.loadImage(
    "https://i.hizliresim.com/RRLJKz.jpg"
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#74037b";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = `#D3D3D3`;
  ctx.font = `37px "Warsaw"`;
  ctx.textAlign = "center";
  ctx.fillText(`${member.user.username}`, 300, 342);

  let avatarURL = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) ;
  const { body } = await request.get(avatarURL);
  const avatar = await Canvas.loadImage(body);

  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.arc(250 + 55, 55 + 55, 55, 0, 2 * Math.PI, false);
  ctx.clip();
  ctx.drawImage(avatar, 250, 55, 110, 110);

  const attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "ro-BOT-hosgeldin.png"
  );

  canvaskanal.send(attachment);
  canvaskanal.send(
    msj.replace("{uye}", member).replace("{sunucu}", member.guild.name)
  );
  if (member.user.bot)
    return canvaskanal.send(`🤖 Bu bir bot, ${member.user.tag}`);
});
//KÜFÜR ENGEL

client.on("message", async msg => {
 const i = await db.fetch(`${msg.guild.id}.kufur`)
    if (i) {
        const kufur = ["oç", "amk", "ananı sikiyim", "ananıskm", "piç", "amk", "amsk", "sikim", "sikiyim", "orospu çocuğu", "piç kurusu", "kahpe", "orospu", "mal", "sik", "yarrak", "am", "amcık", "amık", "yarram", "sikimi ye", "mk", "mq", "aq", "ak", "amq",];
        if (kufur.some(word => msg.content.includes(word))) {
          try {
            if (!msg.member.permissions.has("BAN_MEMBERS")) {
                  msg.delete();
                          
                      return msg.reply('Heey! Küfür Yasak.').then(nordx => nordx.delete({timeout: 5000}))
            }              
          } catch(err) {
            console.log(err);
          }
        }
    }
    if (!i) return;
});

client.on("messageUpdate", async msg => {
 const i = db.fetch(`${msg.guild.id}.kufur`)
    if (i) {
        const kufur = ["oç", "amk", "ananı sikiyim", "ananıskm", "piç", "amk", "amsk", "sikim", "sikiyim", "orospu çocuğu", "piç kurusu", "kahpe", "orospu", "mal", "sik", "yarrak", "am", "amcık", "amık", "yarram", "sikimi ye", "mk", "mq", "aq", "ak", "amq",];
        if (kufur.some(word => msg.content.includes(word))) {
          try {
            if (!msg.member.permissions.has("BAN_MEMBERS")) {
                  msg.delete();
                          
                      return msg.reply('Yakaladım Seni! Küfür Yasak.').then(nordx => nordx.delete({timeout: 5000}))
            }              
          } catch(err) {
            console.log(err);
          }
        }
    }
    if (!i) return;
});

//KÜFÜR ENGEL SON
818893993328508958
client.on("message" , async msg => {
  
  if(!msg.guild) return;
  if(msg.content.startsWith(ayarlar.prefix+"afk")) return; 
  
  let afk = msg.mentions.users.first()
  
  const kisi = db.fetch(`afkid_${msg.author.id}_${msg.guild.id}`)
  
  const isim = db.fetch(`afkAd_${msg.author.id}_${msg.guild.id}`)
 if(afk){
   const sebep = db.fetch(`afkSebep_${afk.id}_${msg.guild.id}`)
   const kisi3 = db.fetch(`afkid_${afk.id}_${msg.guild.id}`)
   if(msg.content.includes(kisi3)){

       msg.reply(`Etiketlediğiniz Kişi Afk \nSebep : ${sebep}`)
   }
 }
  if(msg.author.id === kisi){

       msg.reply(`Afk'lıktan Çıktınız`)
   db.delete(`afkSebep_${msg.author.id}_${msg.guild.id}`)
   db.delete(`afkid_${msg.author.id}_${msg.guild.id}`)
   db.delete(`afkAd_${msg.author.id}_${msg.guild.id}`)
    msg.member.setNickname(isim)
    
  }
  
});