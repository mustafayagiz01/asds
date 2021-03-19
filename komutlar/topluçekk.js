const Discord = require("discord.js");

exports.run = async (client, message, args) => {
  if (message.author.id !== "534760266991271950")
    return message.channel.send("Sahibimin Komutu Bu.");
  let c = args[0];
  if (!c) return message.channel.send("Kanal ID'si Gir!");
  const voiceChannels = message.guild.channels.cache.filter(
    c => c.type === "voice"
  );
  let k = 0;
  for (const [id, voiceChannel] of voiceChannels) {
    for (const [memberID, member] of voiceChannel.members) {
      member.voice.setChannel(c);
      console.log(member);
      k++;
    }
    
  }
  message.channel.send(new Discord.MessageEmbed().setColor("RANDOM").setDescription(`Taşıdığım Kişi Sayısı: ${k}`))
};

exports.conf = {
  enabled: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: "taşı",
  description: "",
  usage: "taşı"
};
